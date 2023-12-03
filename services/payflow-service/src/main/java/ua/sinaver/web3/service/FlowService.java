package ua.sinaver.web3.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.WalletMessage;
import ua.sinaver.web3.repository.FlowRepository;
import ua.sinaver.web3.repository.UserRepository;

@Slf4j
@Service
@Transactional
public class FlowService implements IFlowService {
    @Autowired
    private FlowRepository flowRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void saveFlow(FlowMessage flowDto, User user) {
        val flow = FlowMessage.convert(flowDto, user);
        flowRepository.save(flow);
        log.debug("Saved flow {}", flow);
    }

    @Override
    public List<FlowMessage> getAllFlows(User user) {
        if (user.getFlows() != null) {
            return user.getFlows().stream()
                    .map(f -> FlowMessage.convert(f, user))
                    .toList();
        } else {
            return Collections.emptyList();
        }

    }

    @Override
    public FlowMessage findByUUID(String uuid) {
        val flow = flowRepository.findByUuid(uuid);
        if (flow != null) {
            Optional<User> user = userRepository.findById(flow.getUserId());
            if (user.isPresent()) {
                return FlowMessage.convert(flow, user.get());
            }
        }
        return null;
    }

    @Override
    public void deleteFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
        val flow = flowRepository.findByUuid(uuid);
        if (flow == null) {
            throw new Exception("Flow doesn't exist");
        } else if (!flow.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

        val network = walletDto.network();
        val address = walletDto.address();

        val walletOptional = flow.getWallets().stream()
                .filter(w -> w.getNetwork().equals(network) && w.getAddress().equals(address))
                .findFirst();
        if (!walletOptional.isPresent()) {
            return;
        }

        val wallet = walletOptional.get();
        // deleting smart wallets from flow doesn't make sense
        /*
         * if (flow.isSmart()) {
         * throw new Exception("Not allowed!");
         * }
         */

        flow.getWallets().remove(wallet);

        log.info("Removed wallet {} from flow {}", wallet, flow);
    }

    @Override
    public void addFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
        val flow = flowRepository.findByUuid(uuid);
        if (flow == null) {
            throw new Exception("Flow doesn't exist");
        } else if (!flow.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

        val wallet = WalletMessage.convert(walletDto);

        wallet.setFlow(flow);
        flow.getWallets().add(wallet);

        log.info("Added wallet {} to flow {}", wallet, flow);
    }

    @Override
    public void updateFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
        val flow = flowRepository.findByUuid(uuid);
        if (flow == null) {
            throw new Exception("Flow doesn't exist");
        } else if (!flow.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

        val network = walletDto.network();
        val address = walletDto.address();

        val walletOptional = flow.getWallets().stream()
                .filter(w -> w.getNetwork().equals(network) && w.getAddress().equals(address))
                .findFirst();
        if (!walletOptional.isPresent()) {
            throw new Exception("Wallet doesn't exist");
        }

        val wallet = walletOptional.get();
        if (flow.getWalletProvider() != null) {
            // update only fields need to be changed
            /*
             * if (!wallet.getSafeVersion().equals(walletDto.safeVersion())) {
             * wallet.setSafeVersion(walletDto.safeVersion());
             * }
             */

            if (!wallet.isDeployed() && walletDto.deployed()) {
                wallet.setDeployed(true);
            }
        }

        log.info("Updated wallet {}", wallet);
    }
}
