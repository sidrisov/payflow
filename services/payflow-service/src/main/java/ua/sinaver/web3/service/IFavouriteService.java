package ua.sinaver.web3.service;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FavouriteMessage;

import java.util.List;

public interface IFavouriteService {
	void update(FavouriteMessage favourite, User user);

	List<FavouriteMessage> getAllFavourites(User user);
}
