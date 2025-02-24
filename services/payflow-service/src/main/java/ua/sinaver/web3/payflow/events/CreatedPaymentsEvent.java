package ua.sinaver.web3.payflow.events;

import java.util.List;

public record CreatedPaymentsEvent(List<Integer> ids) {
}
