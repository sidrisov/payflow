package ua.sinaver.web3.payflow.message.protocol;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreatePaymentResponse {
    private String referenceId;
}
