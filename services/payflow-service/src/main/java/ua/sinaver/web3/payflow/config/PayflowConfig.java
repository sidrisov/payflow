package ua.sinaver.web3.payflow.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class PayflowConfig {

	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Value("${payflow.frames.url}")
	private String framesServiceUrl;
	@Value("${payflow.invitation.whitelisted.fid:1500000}")
	private int whitelistedFidUpperRange;

}
