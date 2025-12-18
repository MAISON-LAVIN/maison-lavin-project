public with sharing class QuotationController {
    
    /**
     * Product 정보 조회 (이름 + 가격)
     * @param productId Product2 ID
     * @return ProductWrapper
     */
    @AuraEnabled(cacheable=true)
    public static ProductWrapper getProductInfo(Id productId) {
        try {
            Product2 product = [
                SELECT Name, Price__c
                FROM Product2
                WHERE Id = :productId
                LIMIT 1
            ];
            
            return new ProductWrapper(
                product.Name,
                product.Price__c != null ? product.Price__c : 0
            );
            
        } catch (Exception e) {
            throw new AuraHandledException('제품을 찾을 수 없습니다: ' + e.getMessage());
        }
    }
    
    /**
     * 시안 파일 목록 조회 (이미지만)
     * @param opportunityId Opportunity ID
     * @return List<ContentDocumentWrapper>
     */
    @AuraEnabled(cacheable=true)
    public static List<ContentDocumentWrapper> getDesignFiles(Id opportunityId) {
        List<ContentDocumentWrapper> files = new List<ContentDocumentWrapper>();
        
        try {
            for (ContentDocumentLink cdl : [
                SELECT ContentDocumentId, 
                       ContentDocument.Title,
                       ContentDocument.LatestPublishedVersionId,
                       ContentDocument.FileExtension
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :opportunityId
                AND ContentDocument.FileExtension IN ('png', 'jpg', 'jpeg')
                ORDER BY ContentDocument.CreatedDate DESC
            ]) {
                files.add(new ContentDocumentWrapper(
                    cdl.ContentDocumentId,
                    cdl.ContentDocument.Title,
                    cdl.ContentDocument.LatestPublishedVersionId,
                    '/sfc/servlet.shepherd/version/download/' + cdl.ContentDocument.LatestPublishedVersionId
                ));
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('시안 파일을 불러올 수 없습니다: ' + e.getMessage());
        }
        
        return files;
    }
    
    /**
     * 견적서 생성 및 Opportunity 업데이트
     * @param data JSON 문자열 (opportunityId, designType, selectedDesignId, totalAmount)
     * @return String 성공 메시지
     */
    @AuraEnabled
    public static String createQuotation(String data) {
        try {
            // JSON 파싱
            Map<String, Object> params = (Map<String, Object>) JSON.deserializeUntyped(data);
            
            Id opportunityId = (Id) params.get('opportunityId');
            String designType = (String) params.get('designType');
            String selectedDesignId = (String) params.get('selectedDesignId');
            Decimal totalAmount = Decimal.valueOf(String.valueOf(params.get('totalAmount')));
            
            // 유효성 검사
            if (String.isBlank(designType)) {
                throw new AuraHandledException('디자인 타입을 선택해주세요.');
            }
            
            if (String.isBlank(selectedDesignId)) {
                throw new AuraHandledException('최종 시안을 선택해주세요.');
            }
            
            if (totalAmount == null || totalAmount <= 0) {
                throw new AuraHandledException('총액이 올바르지 않습니다.');
            }
            
            // Opportunity 업데이트
            Opportunity opp = new Opportunity(
                Id = opportunityId,
                Design_Type__c = designType,
                Selected_Design_Id__c = selectedDesignId,
                Total_Amount__c = totalAmount,
                Quotation_PDF_URL__c = '/apex/QuotationPDF?id=' + opportunityId
            );
            
            update opp;
            
            return 'Success';
            
        } catch (DmlException e) {
            throw new AuraHandledException('Opportunity 업데이트 실패: ' + e.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException('견적서 생성 실패: ' + e.getMessage());
        }
    }
    
    /**
     * Product Wrapper Class
     */
    public class ProductWrapper {
        @AuraEnabled public String name;
        @AuraEnabled public Decimal price;
        
        public ProductWrapper(String name, Decimal price) {
            this.name = name;
            this.price = price;
        }
    }
    
    /**
     * ContentDocument Wrapper Class
     */
    public class ContentDocumentWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String title;
        @AuraEnabled public String versionId;
        @AuraEnabled public String downloadUrl;
        
        public ContentDocumentWrapper(String id, String title, String versionId, String downloadUrl) {
            this.id = id;
            this.title = title;
            this.versionId = versionId;
            this.downloadUrl = downloadUrl;
        }
    }
}