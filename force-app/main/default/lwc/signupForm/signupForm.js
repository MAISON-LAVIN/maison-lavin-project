import { LightningElement, track } from 'lwc';
import checkEmailStatus from '@salesforce/apex/SignupEmailService.checkEmailStatus';

export default class SignupForm extends LightningElement {
    @track name = '';
    @track email = '';

    handleNameChange(event) {
        this.name = event.target.value;
    }

    handleEmailChange(event) {
        this.email = event.target.value;
    }

    async handleSignup() {
        if (!this.name || !this.email) {
            alert('이름과 이메일을 입력해주세요.');
            return;
        }

        try {
            const result = await checkEmailStatus({
                email: this.email
            });

            // 1️. 기존 고객이 아님
            if (!result.exists) {
                alert('기존 고객이 아닙니다.');
                return;
            }

            // 2. 이미 회원가입된 이메일
            if (result.alreadyRegistered) {
                alert('이미 회원가입이 되어있습니다.');
                return;
            }

            // 3. 회원가입 가능 (발표용 성공 처리)
            alert('회원가입이 완료되었습니다.');

        } catch (error) {
            console.error('Apex Error:', error);
            alert('오류가 발생했습니다. 관리자에게 문의하세요.');
        }
    }
}