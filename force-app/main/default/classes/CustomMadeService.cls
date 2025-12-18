public without sharing class CustomMadeService {

    @AuraEnabled(cacheable=true)
    public static Boolean isEligibleForCustomMade(String email) {
        if (String.isBlank(email)) return false;

        String normalized = email.trim().toLowerCase();

        // 이메일 비교를 대소문자 영향 최소화하려면 아래처럼 처리
        // (SOQL에서 lower() 함수가 항상 허용되는 건 아니어서,
        //  우선 Email = :email 형태 + 입력 정규화로 가는 게 현실적)
        List<Lead> leads = [
            SELECT Id
            FROM Lead
            WHERE Email = :normalized
            LIMIT 1
        ];

        return !leads.isEmpty();
    }
}