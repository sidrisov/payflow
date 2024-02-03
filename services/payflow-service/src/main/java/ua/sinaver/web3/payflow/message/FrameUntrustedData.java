package ua.sinaver.web3.payflow.message;

public record FrameUntrustedData(long fid, String url, String messageHash, long timestamp,
                                 int network, int buttonIndex, String inputText,
                                 FrameCastId castId) {
}