public with sharing class PersonEmailCheckController {

    @AuraEnabled(cacheable=true)
    public static Boolean existsPersonEmail(String email) {
        if (String.isBlank(email)) return false;

        String normalized = email.trim().toLowerCase();

        List<Account> accs = [
            SELECT Id
            FROM Account
            WHERE Custom_Email__c = :normalized
            LIMIT 1
        ];

        return !accs.isEmpty();
    }
}