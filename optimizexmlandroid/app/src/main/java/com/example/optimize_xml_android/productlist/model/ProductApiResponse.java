package com.example.optimize_xml_android.productlist.model;

public class ProductApiResponse {
    private ApiStatus status;
    private ProductResult result;

    public ProductApiResponse(ApiStatus status, ProductResult result) {
        this.status = status;
        this.result = result;
    }

    public ApiStatus getStatus() {
        return status;
    }

    public void setStatus(ApiStatus status) {
        this.status = status;
    }

    public ProductResult getResult() {
        return result;
    }

    public void setResult(ProductResult result) {
        this.result = result;
    }
}
