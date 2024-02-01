package ua.sinaver.web3.payflow.message;

import java.util.List;

public record ConnectedAddresses(String userAddress, List<String> connectedAddresses) {
}
