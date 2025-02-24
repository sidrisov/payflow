package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.entity.Gift;
import ua.sinaver.web3.payflow.entity.User;

import java.util.List;

import org.springframework.stereotype.Repository;

@Repository
public interface GiftRepository extends CrudRepository<Gift, Integer> {

	List<Gift> findAllByGifter(User gifter);

	List<Gift> findAllBy();
}
