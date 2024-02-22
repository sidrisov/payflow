package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Gift;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public interface GiftRepository extends CrudRepository<Gift, Integer> {

	List<Gift> findAllByGifter(User gifter);

	List<Gift> findAllBy();
}
