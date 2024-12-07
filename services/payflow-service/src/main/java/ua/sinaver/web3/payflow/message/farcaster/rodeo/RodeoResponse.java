package ua.sinaver.web3.payflow.message.farcaster.rodeo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RodeoResponse {
    private Data data;
    
    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {
        private UserProfile userProfile;
    }
    
    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserProfile {
        private String username;
        private List<Wallet> wallets;
    }
    
    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Wallet {
        private String address;
        private String connectorType;
    }
} 
