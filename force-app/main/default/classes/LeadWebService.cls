@RestResource(urlMapping='/api/lead/*')
global class LeadWebService {
    
    @HttpPost
    global static Response createLead(String email, String phone, String lastName, String company) {
        Response res = new Response();
        
        // 1. 기존 Lead 검색 (이메일 또는 전화번호)
        List<Lead> existing = [
            SELECT Id, Email, Status 
            FROM Lead 
            WHERE (Email = :email) 
            AND IsConverted = false
            LIMIT 1
        ];
        
        if (!existing.isEmpty()) {
            // 2. 중복 발견
            Lead old = existing[0];
            res.success = true;
            res.message = '기존 고객입니다.';
            res.leadId = old.Id;
            
        } else {
            // 3. 신규 Lead 생성
            Lead newLead = new Lead(
                Email = email,
                Phone = phone,
                LastName = lastName,
                Company = company,
                LeadSource = 'Website',
                Status = 'Open - Not Contacted'
            );
            insert newLead;
            
            res.success = true;
            res.message = '등록 완료!';
            res.leadId = newLead.Id;
        }
        
        return res;
    }
    
    global class Response {
        public Boolean success;
        public String message;
        public String leadId;
    }
}