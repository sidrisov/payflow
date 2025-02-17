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
import org.web3j.utils.Convert;
import ua.sinaver.web3.payflow.message.FramePaymentMessage;
import ua.sinaver.web3.payflow.entity.Payment;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

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

	@Autowired
	private PaymentService paymentService;
	@Autowired
	private TokenService tokenService;

	@Autowired
	private TokenPriceService tokenPriceService;

	public TransactionService(@Value("${payflow.crypto.base.rpc:https://mainnet.base.org}") String baseRpc) {
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

		var tokenAmount = paymentService.getTokenAmount(paymentMessage, this);

		if (isERC20Transfer) {
			var value = BigInteger.valueOf(0);
			if (token.decimals().equals(6)) {
				value = Convert.toWei(BigDecimal.valueOf(tokenAmount), Convert.Unit.MWEI)
						.toBigInteger();
			} else if (token.decimals().equals(18)) {
				value = Convert.toWei(BigDecimal.valueOf(tokenAmount), Convert.Unit.ETHER)
						.toBigInteger();
			}

			log.debug("Token amount {} value {} price {} for {}", tokenAmount, value,
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
			val value = Convert.toWei(BigDecimal.valueOf(tokenAmount), Convert.Unit.ETHER)
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
		val txParams = generateTxParams(payment);
		if (txParams == null)
			return null;

		val token = tokenService.getTokens().stream()
				.filter(t -> t.chainId().equals(payment.getNetwork()) && t.id().equals(payment.getToken()))
				.findFirst().orElse(null);

		val isERC20Transfer = token != null && token.tokenAddress() != null;

		if (isERC20Transfer) {
			return String.format("""
							{
							  "chainId": "eip155:%s",
							  "method": "eth_sendTransaction",
							  "params": {
							    "abi": %s,
							    "to": "%s",
							    "data": "%s"
							  }
							}""", payment.getNetwork(), ERC20_ABI_TRANSFER_JSON, txParams.get("to"),
					txParams.get("data"));
		} else {
			return String.format("""
					{
					  "chainId": "eip155:%s",
					  "method": "eth_sendTransaction",
					  "attribution": false,
					  "params": {
					    "abi": [],
					    "to": "%s",
					    "value": "%s"
					  }
					}""", payment.getNetwork(), txParams.get("to"), txParams.get("value"));
		}
	}

	public Map<String, String> generateTxParams(Payment payment) {
		val token = tokenService.getTokens().stream()
				.filter(t -> t.chainId().equals(payment.getNetwork()) && t.id().equals(payment.getToken()))
				.findFirst().orElse(null);

		if (token == null) {
			log.error("Token not found for {}", payment);
			return null;
		}

		val isERC20Transfer = token.tokenAddress() != null;
		val address = paymentService.getPaymentReceiverAddress(payment);
		var tokenAmount = paymentService.getTokenAmount(payment);

		if (isERC20Transfer) {
			var value = BigInteger.valueOf(0);
			if (token.decimals().equals(6)) {
				value = Convert.toWei(BigDecimal.valueOf(tokenAmount), Convert.Unit.MWEI).toBigInteger();
			} else if (token.decimals().equals(18)) {
				value = Convert.toWei(BigDecimal.valueOf(tokenAmount), Convert.Unit.ETHER).toBigInteger();
			}

			val function = new Function(
					"transfer",
					Arrays.asList(new Address(address), new Uint256(value)),
					List.of(new TypeReference<Bool>() {
					}));
			val encodedFunction = FunctionEncoder.encode(function);

			return Map.of(
					"to", token.tokenAddress(),
					"data", encodedFunction);
		} else {
			val value = Convert.toWei(BigDecimal.valueOf(tokenAmount), Convert.Unit.ETHER).toBigInteger();

			return Map.of(
					"to", address,
					"value", value.toString());
		}
	}
}
