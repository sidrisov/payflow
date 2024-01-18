package ua.sinaver.web3.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.data.Favourite;
import ua.sinaver.web3.data.User;

import java.util.List;

public interface FavouriteRepository extends CrudRepository<Favourite, Integer> {

	default List<Favourite> findAllByUser(User user) {
		return findAllByUserAndProfileCheckedTrueOrUserAndAddressCheckedTrue(user, user);
	}

	List<Favourite> findAllByUserAndProfileCheckedTrueOrUserAndAddressCheckedTrue(User user1, User user2);

	Favourite findByUserAndIdentity(
			User user,
			String identity);
}
