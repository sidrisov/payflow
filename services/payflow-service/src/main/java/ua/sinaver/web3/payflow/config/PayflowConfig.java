package ua.sinaver.web3.payflow.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Getter
@Component
public class PayflowConfig {

	public static final List<String> MINIAPP_REDIRECT_ALLOWLIST = Collections.emptyList();
	//Collections.singletonList("sinaver.eth");
	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Value("${payflow.frames.url}")
	private String framesServiceUrl;
	@Value("${payflow.invitation.whitelisted.fid:200000}")
	private int whitelistedFidUpperRange;

}
