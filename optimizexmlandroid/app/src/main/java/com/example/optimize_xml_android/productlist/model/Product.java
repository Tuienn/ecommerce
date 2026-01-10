package com.example.optimize_xml_android.productlist.model;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class Product {
    private String name;
    private double basePrice;
    private double price;
    private int discountPercent;
    private int soldCount;
    private String image;

    public Product(String name, double basePrice, double price, int discountPercent, int soldCount, String image) {
        this.name = name;
        this.basePrice = basePrice;
        this.price = price;
        this.discountPercent = discountPercent;
        this.soldCount = soldCount;
        this.image = image;
    }

    // Static factory method to create Product from JSON
    public static Product fromJson(JSONObject json) throws JSONException {
        String name = json.getString("name");
        
        // Parse prices directly from root level
        double basePrice = json.getDouble("basePrice");
        double finalPrice = json.getDouble("price");
        int discountPercent = json.getInt("discountPercent");
        
        // Parse soldCount
        int soldCount = json.getInt("soldCount");
        
        // Parse images array (get first image or empty string)
        String image = "";
        if (json.has("images")) {
            JSONArray imagesArray = json.getJSONArray("images");
            if (imagesArray.length() > 0) {
                image = imagesArray.getString(0);
            }
        }
        
        return new Product(name, basePrice, finalPrice, discountPercent, soldCount, image);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(double basePrice) {
        this.basePrice = basePrice;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(int discountPercent) {
        this.discountPercent = discountPercent;
    }

    public int getSoldCount() {
        return soldCount;
    }

    public void setSoldCount(int soldCount) {
        this.soldCount = soldCount;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
