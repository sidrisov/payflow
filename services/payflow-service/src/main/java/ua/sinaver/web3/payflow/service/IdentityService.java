package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@Transactional
public class IdentityService implements IIdentityService {


	@Autowired
	private InvitationRepository invitationRepository;

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ISocialGraphService socialGraphService;

	// reuse property to increase the contacts limit
	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> whitelistedUsers;

	@Override
	public List<IdentityMessage> getIdentitiesInfo(List<String> identities) {
		log.debug("Fetching {} identities", identities);
		try {
			val identityMessages = Flux
					.fromIterable(identities)
					.flatMap(identity -> Mono.zip(
											Mono.just(identity),
											Mono.fromCallable(
															() -> Optional.ofNullable(userRepository.findByIdentityAndAllowedTrue(identity)))
													.onErrorResume(exception -> {
														log.error("Error fetching user {} - {}",
																identity,
																exception.getMessage());
														return Mono.empty();
													}),
											Mono.fromCallable(
															() -> socialGraphService.getSocialMetadata(identity, null))
													.subscribeOn(Schedulers.boundedElastic())
													.onErrorResume(exception -> {
														log.error("Error fetching social graph for {} - " +
																		"{}",
																identity,
																exception.getMessage());
														return Mono.empty();
													}),
											// TODO: fetch only if social graph fetched
											Mono.fromCallable(
															() -> whitelistedUsers.contains(identity)
																	|| invitationRepository.existsByIdentityAndValid(identity))
													.onErrorResume(exception -> {
														log.error("Error checking invitation status for user {} - {}",
																identity,
																exception.getMessage());
														return Mono.empty();
													}))
									.map(tuple -> IdentityMessage.convert(
											identity,
											tuple.getT2().orElse(null),
											tuple.getT3(),
											tuple.getT4()))
							// TODO: fail fast, seems doesn't to work properly with threads
					)
					.timeout(Duration.ofSeconds(10), Mono.empty())
					.collectList()
					.block();

			log.debug("Fetched {} identities for list: {}", identityMessages.size(),
					identities);

			return identityMessages;
		} catch (Throwable t) {
			log.error("Failed to fetch contacts", t);
			return Collections.emptyList();
		}
	}
}
