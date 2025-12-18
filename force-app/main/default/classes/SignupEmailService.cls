public with sharing class SignupEmailService {

    @AuraEnabled(cacheable=true)
    public static Map<String, Boolean> checkEmailStatus(String email) {

        Map<String, Boolean> result = new Map<String, Boolean>{
            'exists' => false,
            'alreadyRegistered' => false
        };

        if (String.isBlank(email)) {
            return result;
        }

        String normalized = email.trim().toLowerCase();

        List<Account> accs = [
            SELECT Id, Email_Registration_Status__c
            FROM Account
            WHERE Custom_Email__c = :normalized
            LIMIT 1
        ];

        if (!accs.isEmpty()) {
            result.put('exists', true);

            if (accs[0].Email_Registration_Status__c == true) {
                result.put('alreadyRegistered', true);
            }
        }

        return result;
    }
}