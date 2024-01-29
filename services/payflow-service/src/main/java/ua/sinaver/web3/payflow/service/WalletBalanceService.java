package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Convert;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;

@Slf4j
@Service
public class WalletBalanceService {

	private final Web3j web3j;

	public WalletBalanceService(@Value("${payflow.crypto.base.rpc:https://mainnet.base.org}") String baseRpc) {
		web3j = Web3j.build(new HttpService(baseRpc));
	}

	public String getWalletBalance(String address) {
		try {

			BigInteger balanceWei = web3j.ethGetBalance(address, DefaultBlockParameterName.LATEST).send().getBalance();
			BigDecimal balanceEther = Convert.fromWei(balanceWei.toString(), Convert.Unit.ETHER);

			// Round to 5 decimal places using setScale
			BigDecimal roundedBalance = balanceEther.equals(new BigDecimal(0)) ? balanceEther :
					balanceEther.setScale(5, RoundingMode.HALF_UP);

			log.debug("Balance for address {} : {} ETH", address, balanceEther);

			return roundedBalance.toString();
		} catch (IOException e) {
			System.err.println("Error fetching balance: " + e.getMessage());
		}

		return null;
	}
}
