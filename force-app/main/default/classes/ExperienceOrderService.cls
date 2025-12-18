public with sharing class ExperienceOrderService {

    public class Result {
        @AuraEnabled public Id accountId;
        @AuraEnabled public Id opportunityId;
        @AuraEnabled public Id leadId;

        public Result(Id accountId, Id opportunityId, Id leadId) {
            this.accountId = accountId;
            this.opportunityId = opportunityId;
            this.leadId = leadId;
        }
    }

    @AuraEnabled
    public static Result createOrder(String email, String orderName) {
        if (String.isBlank(email)) {
            throw new AuraHandledException('Email is required');
        }

        // 1) Lead 조회
        Lead l = [
            SELECT Id, FirstName, LastName, Company, Email
            FROM Lead
            WHERE Email = :email
            LIMIT 1
        ];

        // 2) Account: Custom_Email__c로 기존 있으면 재사용, 없으면 생성
        Account acc;
        List<Account> existing = [
            SELECT Id, Name, Custom_Email__c
            FROM Account
            WHERE Custom_Email__c = :email
            LIMIT 1
        ];

        if (!existing.isEmpty()) {
            acc = existing[0];
        } else {
            String accName =
                !String.isBlank(l.Company) ? l.Company :
                (!String.isBlank(l.LastName) ? l.LastName + ' 고객' : email);

            acc = new Account(
                Name = accName,
                Custom_Email__c = email
            );
            insert acc;
        }

        // 3) Opportunity 생성 (Account 연결 + Lead 연결)
        String oppName =
            !String.isBlank(orderName) ? orderName :
            (!String.isBlank(l.LastName) ? l.LastName + ' 주문' : email + ' 주문');

        Opportunity opp = new Opportunity(
            Name = oppName,
            StageName = '주문접수',
            CloseDate = Date.today(),
            AccountId = acc.Id,
            Source_Lead__c = l.Id,
            Design_Type__c = '주문제작'
        );
        insert opp;

        return new Result(acc.Id, opp.Id, l.Id);
    }
}