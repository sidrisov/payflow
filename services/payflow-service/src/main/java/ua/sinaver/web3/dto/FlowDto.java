package ua.sinaver.web3.dto;

import java.util.List;

public record FlowDto(String account, String title, String description, String uuid, List<WalletDto> wallets) {
}
