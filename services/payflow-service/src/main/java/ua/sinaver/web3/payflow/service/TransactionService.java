package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.contracts.eip20.generated.ERC20;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Convert;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.FramePaymentMessage;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
public class TransactionService {

	public static final String ERC20_ABI_TRANSFER_JSON = """
			[
				{
			       "constant": false,
			       "inputs": [
			           {
			               "name": "_to",
			               "type": "address"
			           },
			           {
			               "name": "_value",
			               "type": "uint256"
			           }
			       ],
			       "name": "transfer",
			       "outputs": [
			           {
			               "name": "",
			               "type": "bool"
			           }
			       ],
			       "payable": false,
			       "stateMutability": "nonpayable",
			       "type": "function"
			    }
			]
			""";
	private final Web3j web3j;
	@Autowired
	private PaymentService paymentService;
	@Autowired
	private TokenService tokenService;

	@Autowired
	private TokenPriceService tokenPriceService;

	public TransactionService(@Value("${payflow.crypto.base.rpc:https://mainnet.base.org}") String baseRpc) {
		web3j = Web3j.build(new HttpService(baseRpc));
	}

	public static boolean isFramePaymentMessageComplete(FramePaymentMessage paymentMessage) {
		return !StringUtils.isBlank(paymentMessage.address())
				&& TokenService.SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS.contains(paymentMessage.chainId())
				&& TokenService.SUPPORTED_FRAME_PAYMENTS_TOKENS.contains(paymentMessage.token())
				&& paymentMessage.usdAmount() >= 1 && !StringUtils.isBlank(paymentMessage.refId());
	}

	public String generateTxCallData(FramePaymentMessage paymentMessage) {
		val token = tokenService.getTokens().stream()
				.filter(t -> t.chainId().equals(paymentMessage.chainId()) && t.id().equals(paymentMessage.token()))
				.findFirst().orElse(null);

		if (token == null) {
			log.error("Token not found for {}", paymentMessage);
			return null;
		}

		val isERC20Transfer = token.tokenAddress() != null;

		var amount = paymentMessage.tokenAmount() != null ? paymentMessage.tokenAmount() :
				paymentMessage.usdAmount() / tokenPriceService.getPrices().get(paymentMessage.token());

		if (isERC20Transfer) {
			var value = BigInteger.valueOf(0);
			if (token.decimals().equals(6)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.MWEI)
						.toBigInteger();
			} else if (token.decimals().equals(18)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.ETHER)
						.toBigInteger();
			}

			log.debug("Token amount {} value {} price {} for {}", amount, value,
					tokenPriceService.getPrices().get(paymentMessage.token()), paymentMessage);

			val function = new Function(
					"transfer",
					Arrays.asList(new Address(paymentMessage.address()), new Uint256(value)),
					List.of(new TypeReference<Bool>() {
					}));
			val encodedFunction = FunctionEncoder.encode(function);
			return String.format("""
							{
							  "chainId": "eip155:%s",
							  "method": "eth_sendTransaction",
							  "params": {
							    "abi": %s,
							    "to": "%s",
							    "data": "%s"
							  }
							}""", paymentMessage.chainId(), ERC20_ABI_TRANSFER_JSON, token.tokenAddress(),
					encodedFunction);
		} else {
			val value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.ETHER)
					.toBigInteger();

			return String.format("""
					{
					  "chainId": "eip155:%s",
					  "method": "eth_sendTransaction",
					  "attribution": false,
					  "params": {
					    "abi": [],
					    "to": "%s",
					    "value": "%s",
					    "data": "0x"
					  }
					}""", paymentMessage.chainId(), paymentMessage.address(), value);
		}
	}

	public String generateTxCallData(Payment payment) {

		val token = tokenService.getTokens().stream()
				.filter(t -> t.chainId().equals(payment.getNetwork()) && t.id().equals(payment.getToken()))
				.findFirst().orElse(null);

		if (token == null) {
			log.error("Token not found for {}", payment);
			return null;
		}

		val isERC20Transfer = token.tokenAddress() != null;

		// TODO: align receiver logic everywhere:
		// 1. if chain supported by profile + default flow + wallet
		// otherwise fallback to verified address
		val address = paymentService.getPaymentReceiverAddress(payment);
		var amount = StringUtils.isNotBlank(payment.getTokenAmount()) ?
				Double.parseDouble(payment.getTokenAmount()) :
				Double.parseDouble(payment.getUsdAmount()) / tokenPriceService.getPrices().get(payment.getToken());

		if (isERC20Transfer) {
			var value = BigInteger.valueOf(0);

			if (token.decimals().equals(6)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.MWEI)
						.toBigInteger();
			} else if (token.decimals().equals(18)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.ETHER)
						.toBigInteger();
			}

			log.debug("Token amount {} value {} price {} for {}", amount, value,
					tokenPriceService.getPrices().get(payment.getToken()), payment);

			val function = new Function(
					"transfer",
					Arrays.asList(new Address(address), new Uint256(value)),
					List.of(new TypeReference<Bool>() {
					}));
			val encodedFunction = FunctionEncoder.encode(function);
			return String.format("""
					{
					  "chainId": "eip155:%s",
					  "method": "eth_sendTransaction",
					  "params": {
					    "abi": %s,
					    "to": "%s",
					    "data": "%s"
					  }
					}""", payment.getNetwork(), ERC20_ABI_TRANSFER_JSON, token.tokenAddress(), encodedFunction);
		} else {
			val value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.ETHER)
					.toBigInteger();

			return String.format("""
					{
					  "chainId": "eip155:%s",
					  "method": "eth_sendTransaction",
					  "attribution": false,
					  "params": {
					    "abi": [],
					    "to": "%s",
					    "value": "%s",
					    "data": "0x"
					  }
					}""", payment.getNetwork(), address, value);
		}
	}


	public Map<String, String> getWalletBalance(String address) {
		/*val transactionManager = new ClientTransactionManager(web3j, address);
		val balanceMap = new HashMap<String, String>();
		try {
			// fetch ether
			val balanceEther = Convert.fromWei(web3j.ethGetBalance(address,
							DefaultBlockParameterName.LATEST)
					.send().getBalance().toString(), Convert.Unit.ETHER);
			// Round to 5 decimal places using setScale
			val roundedBalance = balanceEther.equals(new BigDecimal(0)) ? balanceEther
					: balanceEther.setScale(5, RoundingMode.HALF_UP);

			balanceMap.put(ETH_TOKEN, roundedBalance.toString());

			// fetch ERC20
			val usdcBalance = erc20Balance(BASE_ERC20_TOKEN_ADDRESSES.get(USDC_TOKEN), address,
					transactionManager);
			balanceMap.put(USDC_TOKEN, usdcBalance);

			val degenBalance = erc20Balance(BASE_ERC20_TOKEN_ADDRESSES.get(DEGEN_TOKEN), address,
					transactionManager);
			balanceMap.put(DEGEN_TOKEN, degenBalance);

		} catch (IOException e) {
			System.err.println("Error fetching balance: " + e.getMessage());
		}*/

		return Map.of();
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
			return usdcBalance.equals(new BigDecimal(0)) ? usdcBalance.toString()
					: usdcBalance.setScale(1, RoundingMode.HALF_UP).toString();
		} catch (InterruptedException | ExecutionException e) {
			throw new RuntimeException(e);
		}
	}
}
