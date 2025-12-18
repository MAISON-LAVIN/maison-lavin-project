import { LightningElement, track } from 'lwc';

export default class ProductCustomizeFlowWrapper extends LightningElement {
  @track inputVariables = [];

  connectedCallback() {
    const params = new URLSearchParams(window.location.search);
    const email = (params.get('email') || '').trim();

    this.inputVariables = [
      { name: 'userEmail', type: 'String', value: email }
    ];
  }
}