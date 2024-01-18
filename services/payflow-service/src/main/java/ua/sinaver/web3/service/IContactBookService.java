package ua.sinaver.web3.service;

import org.springframework.cache.annotation.Cacheable;
import ua.sinaver.web3.graphql.generated.types.Wallet;

import java.util.List;

public interface IContactBookService {
	List<String> getAllContacts(String identity);

    Wallet getSocialMetadata(String identity, String me);
}
