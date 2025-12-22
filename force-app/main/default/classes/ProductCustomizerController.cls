public with sharing class ProductCustomizerController {
    
    // 제품 이미지 URL 가져오기
    @AuraEnabled(cacheable=true)
    public static String getProductImage(Id productId) {
        try {
            Product2 product = [
                SELECT Primary_Image_Id__c 
                FROM Product2 
                WHERE Id = :productId 
                LIMIT 1
            ];
            
            if (product.Primary_Image_Id__c != null) {
                return '/sfc/servlet.shepherd/version/download/' + product.Primary_Image_Id__c;
            }
            
            return null;
            
        } catch (Exception e) {
            throw new AuraHandledException('이미지를 불러올 수 없습니다: ' + e.getMessage());
        }
    }
    
    // Product Code로 이미지 가져오기
    @AuraEnabled(cacheable=true)
    public static String getProductImageByCode(String productCode) {
        try {
            Product2 product = [
                SELECT Primary_Image_Id__c 
                FROM Product2 
                WHERE ProductCode = :productCode 
                LIMIT 1
            ];
            
            if (product.Primary_Image_Id__c != null) {
                return '/sfc/servlet.shepherd/version/download/' + product.Primary_Image_Id__c;
            }
            
            return null;
            
        } catch (Exception e) {
            return null;
        }
    }
    
    // 모든 제품 목록 가져오기
    @AuraEnabled(cacheable=true)
    public static List<Product2> getAvailableProducts() {
        return [
            SELECT Id, Name, ProductCode, Description, Primary_Image_Id__c
            FROM Product2 
            WHERE IsActive = true
            ORDER BY Name
        ];
    }

    // 선택 가능한 매장 목록 조회
    @AuraEnabled(cacheable=true)
public static List<Store__c> getAvailableStores() {
    try {
        return [
            SELECT Id, Name, Store_Code__c, Store_Address__c
            FROM Store__c
            WHERE IsActive__c = true
            ORDER BY Name ASC
        ];
        
    } catch (Exception e) {
        throw new AuraHandledException('매장 목록을 불러올 수 없습니다: ' + e.getMessage());
    }
}
}