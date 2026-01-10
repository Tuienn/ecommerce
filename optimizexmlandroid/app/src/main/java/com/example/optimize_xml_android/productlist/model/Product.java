package com.example.optimize_xml_android.productlist.model;

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
