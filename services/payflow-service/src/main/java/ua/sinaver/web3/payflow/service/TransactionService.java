package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.contracts.eip20.generated.ERC20;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.ClientTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Convert;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.Wallet;
import ua.sinaver.web3.payflow.message.CryptoPrice;
import ua.sinaver.web3.payflow.message.FramePaymentMessage;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.HashMap;
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

	public static final String ERC20_ABI_JSON = """
			[
			    {
			        "constant": true,
			        "inputs": [],
			        "name": "name",
			        "outputs": [
			            {
			                "name": "",
			                "type": "string"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "view",
			        "type": "function"
			    },
			    {
			        "constant": false,
			        "inputs": [
			            {
			                "name": "_spender",
			                "type": "address"
			            },
			            {
			                "name": "_value",
			                "type": "uint256"
			            }
			        ],
			        "name": "approve",
			        "outputs": [
			            {
			                "name": "",
			                "type": "bool"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "nonpayable",
			        "type": "function"
			    },
			    {
			        "constant": true,
			        "inputs": [],
			        "name": "totalSupply",
			        "outputs": [
			            {
			                "name": "",
			                "type": "uint256"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "view",
			        "type": "function"
			    },
			    {
			        "constant": false,
			        "inputs": [
			            {
			                "name": "_from",
			                "type": "address"
			            },
			            {
			                "name": "_to",
			                "type": "address"
			            },
			            {
			                "name": "_value",
			                "type": "uint256"
			            }
			        ],
			        "name": "transferFrom",
			        "outputs": [
			            {
			                "name": "",
			                "type": "bool"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "nonpayable",
			        "type": "function"
			    },
			    {
			        "constant": true,
			        "inputs": [],
			        "name": "decimals",
			        "outputs": [
			            {
			                "name": "",
			                "type": "uint8"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "view",
			        "type": "function"
			    },
			    {
			        "constant": true,
			        "inputs": [
			            {
			                "name": "_owner",
			                "type": "address"
			            }
			        ],
			        "name": "balanceOf",
			        "outputs": [
			            {
			                "name": "balance",
			                "type": "uint256"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "view",
			        "type": "function"
			    },
			    {
			        "constant": true,
			        "inputs": [],
			        "name": "symbol",
			        "outputs": [
			            {
			                "name": "",
			                "type": "string"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "view",
			        "type": "function"
			    },
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
			    },
			    {
			        "constant": true,
			        "inputs": [
			            {
			                "name": "_owner",
			                "type": "address"
			            },
			            {
			                "name": "_spender",
			                "type": "address"
			            }
			        ],
			        "name": "allowance",
			        "outputs": [
			            {
			                "name": "",
			                "type": "uint256"
			            }
			        ],
			        "payable": false,
			        "stateMutability": "view",
			        "type": "function"
			    },
			    {
			        "payable": true,
			        "stateMutability": "payable",
			        "type": "fallback"
			    },
			    {
			        "anonymous": false,
			        "inputs": [
			            {
			                "indexed": true,
			                "name": "owner",
			                "type": "address"
			            },
			            {
			                "indexed": true,
			                "name": "spender",
			                "type": "address"
			            },
			            {
			                "indexed": false,
			                "name": "value",
			                "type": "uint256"
			            }
			        ],
			        "name": "Approval",
			        "type": "event"
			    },
			    {
			        "anonymous": false,
			        "inputs": [
			            {
			                "indexed": true,
			                "name": "from",
			                "type": "address"
			            },
			            {
			                "indexed": true,
			                "name": "to",
			                "type": "address"
			            },
			            {
			                "indexed": false,
			                "name": "value",
			                "type": "uint256"
			            }
			        ],
			        "name": "Transfer",
			        "type": "event"
			    }
			]
			""";
	public static final String BASE_CHAIN_NAME = "base";
	public static final Integer BASE_CHAIN_ID = 8453;
	public static final String OP_CHAIN_NAME = "optimism";
	public static final Integer OP_CHAIN_ID = 10;
	public static final Integer DEFAULT_FRAME_PAYMENTS_CHAIN_ID = BASE_CHAIN_ID;
	public static final List<Integer> SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS = Arrays.asList(BASE_CHAIN_ID, OP_CHAIN_ID);

	public static final Map<String, Integer> PAYMENT_CHAINS = Map.of(BASE_CHAIN_NAME, BASE_CHAIN_ID,
			OP_CHAIN_NAME, OP_CHAIN_ID);
	public static final String ETH_TOKEN = "eth";
	public static final String USDC_TOKEN = "usdc";
	public static final String DEGEN_TOKEN = "degen";

	public static final Map<String, String> BASE_ERC20_TOKEN_ADDRESSES = Map.of(USDC_TOKEN,
			"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
			DEGEN_TOKEN, "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed");

	public static final Map<String, String> OPTIMISM_ERC20_TOKEN_ADDRESSES = Map.of(USDC_TOKEN,
			"0x0b2c639c533813f4aa9d7837caf62653d097ff85");

	public static final List<String> SUPPORTED_FRAME_PAYMENTS_TOKENS = Arrays.asList(ETH_TOKEN, USDC_TOKEN,
			DEGEN_TOKEN);
	private final Web3j web3j;
	private final WebClient webClient;
	private Map<String, CryptoPrice> prices = new HashMap<>();

	public TransactionService(@Value("${payflow.crypto.base.rpc:https://mainnet.base.org}") String baseRpc,
	                          WebClient.Builder webClientBuilder) {
		web3j = Web3j.build(new HttpService(baseRpc));
		webClient = webClientBuilder.baseUrl("https://api.coingecko.com/api/v3").build();
	}

	public static boolean isFramePaymentMessageComplete(FramePaymentMessage paymentMessage) {
		return !StringUtils.isBlank(paymentMessage.address())
				&& SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS.contains(paymentMessage.chainId())
				&& SUPPORTED_FRAME_PAYMENTS_TOKENS.contains(paymentMessage.token())
				&& paymentMessage.usdAmount() >= 1 && !StringUtils.isBlank(paymentMessage.refId());
	}

	public String generateTxCallData(FramePaymentMessage paymentMessage) {
		boolean isERC20Transfer = !paymentMessage.token().equals(ETH_TOKEN);

		var amount = paymentMessage.usdAmount() / getPrice(paymentMessage.token());

		if (isERC20Transfer) {
			val to = paymentMessage.chainId() == BASE_CHAIN_ID ?
					BASE_ERC20_TOKEN_ADDRESSES.get(paymentMessage.token()) :
					OPTIMISM_ERC20_TOKEN_ADDRESSES.get(paymentMessage.token());

			var value = BigInteger.valueOf(0);
			if (paymentMessage.token().equals(USDC_TOKEN)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.MWEI)
						.toBigInteger();
			} else if (paymentMessage.token().equals(DEGEN_TOKEN)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.ETHER)
						.toBigInteger();
			}

			log.debug("Token amount {} value {} price {} for {}", amount, value,
					getPrice(paymentMessage.token()), paymentMessage);

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
					}""", paymentMessage.chainId(), ERC20_ABI_TRANSFER_JSON, to, encodedFunction);
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
		boolean isERC20Transfer = !payment.getToken().equals(ETH_TOKEN);

		val address =
				payment.getReceiver() != null ?
						payment.getReceiver().getDefaultFlow().getWallets().stream()
								.filter(wallet -> wallet.getNetwork().equals(payment.getNetwork()))
								.map(Wallet::getAddress).findFirst().orElse(null) : payment.getReceiverAddress();

		var amount = Double.parseDouble(payment.getUsdAmount()) / getPrice(payment.getToken());

		if (isERC20Transfer) {
			val to = payment.getNetwork().equals(BASE_CHAIN_ID) ?
					BASE_ERC20_TOKEN_ADDRESSES.get(payment.getToken()) :
					OPTIMISM_ERC20_TOKEN_ADDRESSES.get(payment.getToken());

			var value = BigInteger.valueOf(0);
			if (payment.getToken().equals(USDC_TOKEN)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.MWEI)
						.toBigInteger();
			} else if (payment.getToken().equals(DEGEN_TOKEN)) {
				value = Convert.toWei(BigDecimal.valueOf(amount), Convert.Unit.ETHER)
						.toBigInteger();
			}

			log.debug("Token amount {} value {} price {} for {}", amount, value,
					getPrice(payment.getToken()), payment);

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
					}""", payment.getNetwork(), ERC20_ABI_TRANSFER_JSON, to, encodedFunction);
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

	@Scheduled(initialDelay = 0, fixedRate = 60 * 1000)
	public void fetchPrices() {
		val prices = webClient.get()
				.uri("/simple/price?ids=ethereum,usd-coin,degen-base&vs_currencies=usd")
				.retrieve()
				.bodyToMono(new ParameterizedTypeReference<Map<String, CryptoPrice>>() {
				})
				.block();

		log.debug("Prices: {}", prices);
		this.prices = prices;
	}

	public double getPrice(String token) {
		var price = -1d;
		try {
			price = switch (token) {
				case ETH_TOKEN -> prices.get("ethereum").usd();
				case USDC_TOKEN -> prices.get("usd-coin").usd();
				case DEGEN_TOKEN -> prices.get("degen-base").usd();
				default -> -1;
			};
		} catch (Throwable t) {
			log.debug("Failed to fetch price for token {}, error: {}", token, t.getMessage());
		}
		return price;
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
			return usdcBalance.equals(new BigDecimal(0)) ? usdcBalance.toString()
					: usdcBalance.setScale(1, RoundingMode.HALF_UP).toString();
		} catch (InterruptedException | ExecutionException e) {
			throw new RuntimeException(e);
		}
	}
}
