import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Events, NavController, NavParams } from 'ionic-angular';

// providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';

// validators
import { AddressValidator } from '../../../../validators/address';
import { ScanPage } from '../../../scan/scan';

@Component({
  selector: 'page-addressbook-add',
  templateUrl: 'add.html'
})
export class AddressbookAddPage {
  private addressBookAdd: FormGroup;

  public isCordova: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private events: Events,
    private ab: AddressBookProvider,
    private addressProvider: AddressProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private popupProvider: PopupProvider
  ) {
    this.addressBookAdd = this.formBuilder.group({
      name: [
        this.navParams.data.contact ? this.navParams.data.contact.name : '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ],
      email: [
        this.navParams.data.contact ? this.navParams.data.contact.email : '',
        this.emailOrEmpty
      ],
      address: [
        this.navParams.data.contact ? this.navParams.data.contact.address : '',
        Validators.compose([
          Validators.required,
          new AddressValidator(this.addressProvider).isValid
        ])
      ]
    });
    if (this.navParams.data.addressbookEntry) {
      this.addressBookAdd.controls['address'].setValue(
        this.navParams.data.addressbookEntry
      );
    }
    this.events.subscribe('update:address', data => {
      this.addressBookAdd.controls['address'].setValue(
        this.parseAddress(data.value)
      );
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddressbookAddPage');
  }

  ngOnDestroy() {
    this.events.unsubscribe('update:address');
  }

  private emailOrEmpty(control: AbstractControl): ValidationErrors | null {
    return control.value === '' ? null : Validators.email(control);
  }

  public save(): void {
    if (this.navParams.data.contact) {
      this.ab
        .remove(this.navParams.data.contact.address)
        .then(() => {
          this.addAddress();
        })
        .catch(err => {
          this.popupProvider.ionicAlert('Error', err);
        });
    } else {
      this.addAddress();
    }
  }

  private addAddress(): void {
    this.addressBookAdd.controls['address'].setValue(
      this.parseAddress(this.addressBookAdd.value.address)
    );
    this.ab
      .add(this.addressBookAdd.value)
      .then(() => {
        if (this.navParams.data.contact) {
          const contact = this.addressBookAdd.value;
          this.navCtrl.pop().then(() => this.navParams.get('resolve')(contact));
        } else {
          this.navCtrl.pop();
        }
      })
      .catch(err => {
        this.popupProvider.ionicAlert('Error', err);
      });
  }

  private parseAddress(address: string): string {
    return address.replace(/^(bitcoincash:|bchtest:|bitcoin:|rhombus:)/i, '');
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromAddressbook: true });
  }
}
