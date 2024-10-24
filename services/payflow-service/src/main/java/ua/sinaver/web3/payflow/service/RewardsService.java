package ua.sinaver.web3.payflow.service;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.log4j.Log4j2;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import static ua.sinaver.web3.payflow.service.TokenService.BASE_CHAIN_ID;

@Log4j2
@Service
public class RewardsService {

    private final ScheduledExecutorService scheduler = Executors
            .newSingleThreadScheduledExecutor(Thread.ofVirtual().factory());
    @Autowired
    private IFarcasterNeynarService neynarService;
    @Autowired
    private IdentityService identityService;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private IdentitySubscriptionsService subscriptionsService;
    @Autowired
    private FarcasterMessagingService farcasterMessagingService;
    @Autowired
    private LinkService linkService;
    @Autowired
    private EntityManager entityManager;

    public Payment createRewardPayment(User clickedProfile, int casterFid, String castHash,
            String category,
            Double amount, Double tokenAmount, String token,
            Integer chainId, String sourceApp,
            String extraLink) {
        val paymentProfile = identityService.getProfiles(casterFid).stream().findFirst().orElse(null);
        String paymentAddress = null;
        if (paymentProfile == null || (paymentProfile.getDefaultFlow() == null
                && paymentProfile.getDefaultReceivingAddress() == null)) {
            val paymentAddresses = identityService.getFidAddresses(casterFid);
            paymentAddress = identityService.getHighestScoredIdentity(paymentAddresses);
            if (paymentAddress == null) {
                log.error("Missing verified identity for caster FID: {}", casterFid);
                return null;
            }
        }

        val casterFcName = identityService.getFidFname(casterFid);
        val sourceRef = String.format("https://warpcast.com/%s/%s",
                casterFcName, castHash.substring(0, 10));

        val payment = new Payment(Payment.PaymentType.INTENT, paymentProfile, chainId, token);
        payment.setCategory(category);
        payment.setReceiverAddress(paymentAddress);
        payment.setSender(clickedProfile);
        if (tokenAmount != null) {
            payment.setTokenAmount(tokenAmount.toString());
        } else {
            payment.setUsdAmount(amount.toString());
        }
        payment.setSourceApp(sourceApp);
        payment.setSourceRef(sourceRef);
        payment.setSourceHash(castHash);
        payment.setTarget(extraLink);

        return payment;
    }

    @Async
    @Transactional
    public void processTopCastRewards(
            List<String> excludeFids,
            String channelId,
            String hypersubContractAddress,
            int numberOfRewards,
            User clickedProfile,
            Double amount, Double tokenAmount, String token, Integer chainId,
            String sourceApp) {

        val clickedProfileManaged = entityManager.merge(clickedProfile);
        val fidToPayment = fetchAndCreateTopCastPayments(
                excludeFids,
                channelId,
                hypersubContractAddress,
                numberOfRewards,
                clickedProfileManaged,
                amount, tokenAmount, token, chainId,
                sourceApp);

        val clickedFid = excludeFids.get(0);
        if (fidToPayment.isEmpty()) {
            farcasterMessagingService.sendMessage(new DirectCastMessage(clickedFid,
                    "❌ Failed to process Top Caster Rewards!", UUID.randomUUID()));
        } else {
            val payments = new ArrayList<>(fidToPayment.values());
            paymentRepository.saveAll(payments);

            // make sure payments are actually stored in db
            entityManager.flush();

            sendRewardMessages(clickedFid, channelId, payments);
        }

    }

    private void sendRewardMessages(String clickedFid, String channelId, List<Payment> payments) {
        val message = String.format("""
                ✅ %s %d Top Caster Rewards submitted.
                Pay in the app:""",
                channelId == null ? "Global" : "/" + channelId,
                payments.size());

        scheduler.execute(() -> {
            farcasterMessagingService.sendMessage(new DirectCastMessage(
                    clickedFid, message, UUID.randomUUID()));

            for (int i = 0; i < payments.size(); i++) {

                try {
                    // 1 second delay between messages
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("Thread was interrupted", e);
                }

                val paymentMessage = String.format("%d. %s",
                        i + 1, linkService.framePaymentLink(payments.get(i)));
                farcasterMessagingService.sendMessage(new DirectCastMessage(
                        clickedFid, paymentMessage, UUID.randomUUID()));
            }
        });
    }

    private Map<Integer, Payment> fetchAndCreateTopCastPayments(List<String> excludedFids,
            String channelId,
            String subscriptionContract,
            int numberOfRewards,
            User clickedProfile,
            Double amount, Double tokenAmount, String token, Integer chainId,
            String sourceApp) {
        val fidToPayment = new LinkedHashMap<Integer, Payment>();
        var cursor = (String) null;

        while (fidToPayment.size() < numberOfRewards) {
            val response = neynarService.fetchTrendingCasts(channelId, "7d",
                    10, cursor);

            if (response == null || response.getCasts() == null || response.getCasts().isEmpty()) {
                break; // No more casts to process
            }

            for (val cast : response.getCasts()) {
                if (excludedFids.contains(String.valueOf(cast.author().fid()))
                        || fidToPayment.containsKey(cast.author().fid())) {
                    continue;
                }

                if (subscriptionContract != null) {
                    val verifications = cast.author().verifications();
                    val subscribers = subscriptionsService.fetchHypersubSubscribers(BASE_CHAIN_ID, subscriptionContract,
                            verifications);
                    val validSubscription = subscribers.stream()
                            .anyMatch(s -> Instant.now().isBefore(Instant.ofEpochSecond(s.purchaseExpiresAt())));
                    if (!validSubscription) {
                        excludedFids.add(String.valueOf(cast.author().fid()));
                        continue;
                    }
                }

                try {
                    val castLink = String.format("https://warpcast.com/%s/%s",
                            cast.author().username(), cast.hash().substring(0, 10));
                    val payment = createRewardPayment(clickedProfile, cast.author().fid(),
                            cast.hash(), "reward_top_casters", amount, tokenAmount, token, chainId,
                            sourceApp, castLink);
                    if (payment != null) {
                        fidToPayment.put(cast.author().fid(), payment);
                        if (fidToPayment.size() == numberOfRewards) {
                            return fidToPayment;
                        }
                    }
                } catch (Throwable t) {
                    log.error("Failed to create a payment for cast: {} - error: {}", cast, t.getMessage());
                }
            }

            // Update cursor for next page
            cursor = response.getNext() != null ? response.getNext().getCursor() : null;
            if (cursor == null) {
                break; // No more pages to fetch
            }
        }

        return fidToPayment;
    }
}
