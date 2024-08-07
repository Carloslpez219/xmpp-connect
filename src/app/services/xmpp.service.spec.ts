import { TestBed } from '@angular/core/testing';

import { XmppService } from './xmpp.service';

describe('XmppService', () => {
  let service: XmppService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XmppService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
