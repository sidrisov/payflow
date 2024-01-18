package ua.sinaver.web3.service;

import jakarta.transaction.Transactional;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FavouriteMessage;
import ua.sinaver.web3.repository.FavouriteRepository;

import java.util.List;

@Service
@Transactional
public class FavouriteService implements IFavouriteService {

	@Autowired
	private FavouriteRepository favouriteRepository;

	@Override
	public void update(FavouriteMessage favouriteMessage, User user) {
		val favourite = favouriteRepository.findByUserAndIdentity(user, favouriteMessage.identity());
		if (favourite != null) {
			// update only fields passed
			if (favouriteMessage.addressChecked() != null) {
				favourite.setAddressChecked(favouriteMessage.addressChecked());
			}
			if (favouriteMessage.profileChecked() != null) {
				favourite.setProfileChecked(favouriteMessage.profileChecked());
			}
		} else {
			favouriteRepository.save(FavouriteMessage.convert(favouriteMessage, user));
		}
	}

	// TODO: filter on db level
	@Override
	public List<FavouriteMessage> getAllFavourites(User user) {
		return favouriteRepository.findAllByUser(user).stream()
				.map(f -> FavouriteMessage.convert(f)).toList();
	}
}
