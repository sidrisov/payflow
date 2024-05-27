package ua.sinaver.web3.payflow.message;

import java.util.List;

public record ContactsResponseMessage(List<String> tags, List<ContactMessage> contacts) {
}
