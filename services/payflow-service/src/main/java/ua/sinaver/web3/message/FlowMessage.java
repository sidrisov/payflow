package ua.sinaver.web3.message;

import java.util.List;

import lombok.val;
import ua.sinaver.web3.data.Flow;
import ua.sinaver.web3.data.User;

public record FlowMessage(String account, String title, String description, String uuid, List<WalletMessage> wallets) {
    public static FlowMessage convert(Flow flow, User user) {
        val wallets = flow.getWallets().stream().map(w -> WalletMessage.convert(w))
                .toList();
        return new FlowMessage(user.getSigner(), flow.getTitle(), flow.getDescription(), flow.getUuid(),
                wallets);
    }

    public static Flow convert(FlowMessage flowDto, User user) {
        val flow = new Flow(user.getId(), flowDto.title(), flowDto.description());
        val wallets = flowDto.wallets().stream().map(w -> {
            val wallet = WalletMessage.convert(w);
            wallet.setFlow(flow);
            return wallet;
        }).toList();
        flow.setWallets(wallets);
        return flow;
    }
}
