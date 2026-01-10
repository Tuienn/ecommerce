package com.example.optimize_xml_android.productlist.network;

public interface ApiCallback<T> {
    void onSuccess(T data);
    void onError(String errorMessage);
}
