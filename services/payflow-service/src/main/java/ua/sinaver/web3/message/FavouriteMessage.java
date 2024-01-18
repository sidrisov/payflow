package ua.sinaver.web3.message;

import lombok.val;
import ua.sinaver.web3.data.Favourite;
import ua.sinaver.web3.data.User;

public record FavouriteMessage(
		String identity, Boolean profileChecked, Boolean addressChecked) {

	public static FavouriteMessage convert(Favourite favourite) {
		return new FavouriteMessage(favourite.getIdentity(), favourite.isProfileChecked(),
				favourite.isAddressChecked());
	}

	public static Favourite convert(FavouriteMessage favouriteMessage, User user) {
		val favourite = new Favourite(user, favouriteMessage.identity());
		if (favouriteMessage.addressChecked != null) {
			favourite.setAddressChecked(favouriteMessage.addressChecked);
		}

		if (favouriteMessage.profileChecked != null) {
			favourite.setProfileChecked(favouriteMessage.profileChecked);
		}
		return favourite;
	}

}
