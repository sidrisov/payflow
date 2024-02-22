package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.contracts.eip20.generated.ERC20;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.ClientTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Convert;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Slf4j
@Service
public class WalletBalanceService {

	private static final String USDC_CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
	private static final String DEGEN_CONTRACT_ADDRESS =
			"0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
	private final Web3j web3j;

	public WalletBalanceService(@Value("${payflow.crypto.base.rpc:https://mainnet.base.org}") String baseRpc) {
		web3j = Web3j.build(new HttpService(baseRpc));
	}

	public Map<String, String> getWalletBalance(String address) {
		val transactionManager = new ClientTransactionManager(web3j, address);
		val balanceMap = new HashMap<String, String>();
		try {
			// fetch ether
			val balanceEther = Convert.fromWei(web3j.ethGetBalance(address,
							DefaultBlockParameterName.LATEST)
					.send().getBalance().toString(), Convert.Unit.ETHER);
			// Round to 5 decimal places using setScale
			val roundedBalance = balanceEther.equals(new BigDecimal(0)) ? balanceEther :
					balanceEther.setScale(5, RoundingMode.HALF_UP);

			balanceMap.put("eth", roundedBalance.toString());

			// fetch ERC20
			val usdcBalance = erc20Balance(USDC_CONTRACT_ADDRESS, address,
					transactionManager);
			balanceMap.put("usdc", usdcBalance);

			val degenBalance = erc20Balance(DEGEN_CONTRACT_ADDRESS, address,
					transactionManager);
			balanceMap.put("degen", degenBalance);

		} catch (IOException e) {
			System.err.println("Error fetching balance: " + e.getMessage());
		}

		return balanceMap;
	}

	private String erc20Balance(String contractAddress, String walletAddress,
	                            TransactionManager txManager) {
		ERC20 contract = ERC20.load(contractAddress, web3j, txManager,
				new DefaultGasProvider());
		try {
			val decimals = contract.decimals().sendAsync().get();
			val balance = contract.balanceOf(walletAddress).sendAsync().get();
			// Convert the balance to ether
			val usdcBalance = new BigDecimal(balance
					.divide(BigInteger.TEN.pow(decimals.intValue())));
			return usdcBalance.equals(new BigDecimal(0)) ? usdcBalance.toString() :
					usdcBalance.setScale(1, RoundingMode.HALF_UP).toString();
		} catch (InterruptedException | ExecutionException e) {
			throw new RuntimeException(e);
		}
	}
}
