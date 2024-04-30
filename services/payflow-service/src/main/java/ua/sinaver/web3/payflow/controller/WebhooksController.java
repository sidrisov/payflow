package ua.sinaver.web3.payflow.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.config.WebhooksConfig;
import ua.sinaver.web3.payflow.data.webhooks.WebhookData;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@RestController
@RequestMapping("/farcaster/webhooks")
@CrossOrigin(origins = "https://conversely-subtle-shad.ngrok-free.app", allowCredentials = "true")
@Slf4j
public class WebhooksController {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebhooksController.class);
    @Autowired
    WebhooksConfig configs;

    @GetMapping("testGet")
    public String testGet() {
        LOGGER.info("webhooks config is: {}", configs.getSecret());

        return "This is a success get method";
    }

    @PostMapping("dummy")
    public ResponseEntity<String> dummy(@RequestHeader("X-Neynar-Signature") String neynarSignature, @RequestBody String body) {
        if (null == neynarSignature) {
            LOGGER.error("No Signature found!");
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        if (null == configs.getSecret()) {
            LOGGER.error("App not setup properly");
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }


        try {
            boolean isValid = verifySignature(body, neynarSignature, configs.getSecret());

            if (!isValid) {
                LOGGER.error("The provided signature is not valid");
                return new ResponseEntity<>("Invalid webhook signature", HttpStatus.BAD_REQUEST);
            }

            ObjectMapper mapper = new ObjectMapper();
            WebhookData data;
            try {
                data = mapper.readValue(body, WebhookData.class);
            } catch (JsonProcessingException e) {
                LOGGER.error("Failed to parse the JSON response", e);
                return new ResponseEntity<>("Invalid JSON Data", HttpStatus.BAD_REQUEST);
            }
            LOGGER.info("Webhook data parsed: {}", data);

            return new ResponseEntity<>("Success", HttpStatus.OK);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            LOGGER.error("Security exception", e);
            return new ResponseEntity<>("Invalid webhook signature", HttpStatus.BAD_REQUEST);
        }
    }

    private boolean verifySignature(String body, String sig, String secret) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac hmacSha512 = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmacSha512.init(secretKey);
        byte[] hmac = hmacSha512.doFinal(body.getBytes(StandardCharsets.UTF_8));

        String generatedSignature = bytesToHex(hmac);

        return generatedSignature.equals(sig);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
