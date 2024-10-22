package ua.sinaver.web3.payflow.message.farcaster.neynar;

import lombok.Data;
import ua.sinaver.web3.payflow.message.farcaster.Cast;

import java.util.List;

@Data
public class TrendingCastsResponse {
	private List<Cast> casts;
	private Next next;

	@Data
	public static class Next {
		private String cursor;
	}
}


