import { LightningElement, track } from 'lwc';
import existsPersonEmail from '@salesforce/apex/PersonEmailCheckController.existsPersonEmail';

export default class PersonEmailSignup extends LightningElement {
  @track email = '';
  @track password = '';
  @track password2 = '';
  @track success = false;
  @track error = '';
  @track loading = false;

  connectedCallback() {
    // 링크에 ?email=test@example.com 같은 값이 오면 자동 채움(데모용)
    const p = new URLSearchParams(window.location.search);
    const e = p.get('email');
    if (e) this.email = e;
  }

  handleChange(e) {
    const { name, value } = e.target;
    this[name] = value;
  }

  async submit() {
    this.error = '';

    if (!this.email || !this.password || !this.password2) {
      this.error = '이메일과 비밀번호를 입력해주세요.';
      return;
    }
    if (this.password !== this.password2) {
      this.error = '비밀번호가 일치하지 않습니다.';
      return;
    }

    this.loading = true;
    try {
      const ok = await existsPersonEmail({ email: this.email });

      if (!ok) {
        this.error = '등록된 고객(Person Account) 이메일이 아닙니다.';
        return;
      }

      // ✅ 실제 User/저장 없음 — 발표용 성공 처리
      this.success = true;
    } catch (err) {
      this.error = err?.body?.message || '시스템 오류가 발생했습니다.';
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  goNext() {
    // 다음 페이지(예: 주문제작 시작) URL - 아직 없으면 '/s/'로 바꿔도 됨
    window.location.assign('/s/order-start');
  }
}