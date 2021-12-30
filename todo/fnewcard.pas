unit fnewcard;

{$mode objfpc}

interface

uses
  Classes, SysUtils, FileUtil, XDBGrids, LR_Class, LR_DBSet, LR_BarC, Forms,
  Controls, Graphics, Dialogs, ExtCtrls, StdCtrls, ComCtrls, DbCtrls, EditBtn,
  Buttons, Menus, ActnList, fBaseDialog, uCard, ZDataset, memds,
  DelphiZXingQRCode, xGrids, (*RichBox,*) RichMemo, DB, types, fPaymentsHistory,
  LMessages, Spin, LR_DSet;

const
  MESSAGE_FROM_SERVER = WM_USER + 1;

type

  TCurrentOperation = (coOpenFile, coPrintFile);
  TSaveOperation = (soSave, soSaveAndClose);

  { TfmNewCard }

  TfmNewCard = class(TfmBaseDialog)
    actBuildList: TAction;
    actClearList: TAction;
    actClearPayments: TAction;
    actDelApartment: TAction;
    actEditApartment: TAction;
    actInsApartment: TAction;
    actCreateFine : TAction ;
    actCopyText: TAction;
    actIncrYear: TAction;
    ActionList1: TActionList;
    actPaymentsHistory: TAction;
    actRefreshList: TAction;
    bnAddCity: TBitBtn;
    bnAddClient: TBitBtn;
    bnAddClient1: TBitBtn;
    bnCreateFine : TButton ;
    bnVerifyContract: TBitBtn;
    bnAddHouse: TBitBtn;
    bnAddStreet: TBitBtn;
    bnBrigadeNotSelected: TButton;
    bnBuildList: TButton;
    bnCityNotSelected: TButton;
    bnClearList: TButton;
    bnClearPayments: TButton;
    bnContracts: TButton;
    bnDeleteApartment: TButton;
    bnEditApartment: TButton;
    bnEditCity: TBitBtn;
    bnEditClient: TBitBtn;
    bnEditClient1: TBitBtn;
    bnEditHouse: TBitBtn;
    bnEditStreet: TBitBtn;
    bnEquipmentNotSelected: TButton;
    bnHouseNotSelected: TButton;
    bnInsertApartment: TButton;
    bnMountingNotSelected: TButton;
    bnPaymentsHistory: TButton;
    bnPrint: TButton;
    bnRefreshClients: TBitBtn;
    bnRefreshClients1: TBitBtn;
    bnSave: TButton;
    bnRefreshCities: TBitBtn;
    bnRefreshHouses: TBitBtn;
    bnRefreshStreets: TBitBtn;
    bnStreetNotSelected: TButton;
    chAttention: TCheckBox;
    chDuplicateMaintenance: TCheckBox;
    chConnection: TCheckBox;
    chmRepaid: TCheckBox;
    chRepaid: TCheckBox;
    chOnePerson: TCheckBox;
    dtCreateDate: TDateEdit;
    dtCreditTo: TDateEdit;
    dtEndContract: TDateEdit;
    dtEndService: TDateEdit;
    dtOrderDateDoor: TDateEdit;
    dtProlongation: TDateEdit;
    dtReceiptPrinting: TDateEdit;
    dtStartService: TDateEdit;
    dtWillingnessDateDoor: TDateEdit;
    edCardID: TEdit;
    edClientPhones: TEdit;
    edContractInfo: TMemo;
    edContractNumber: TEdit;
    edEndApartment: TEdit;
    edMClientPhones: TEdit;
    edNormalPayment: TFloatSpinEdit;
    edNumeration: TEdit;
    edPayment: TEdit;
    edPorch: TEdit;
    edPrivilegePayment: TFloatSpinEdit;
    edServiceInfo: TMemo;
    edStartApartment: TEdit;
    frApartments: TfrReport;
    frBarCodeObject1: TfrBarCodeObject;
    frdsApartments: TfrDBDataSet;
    grdApartments: TxDBGrid;
    GroupBox1: TGroupBox;
    GroupBox2: TGroupBox;
    GroupBox3: TGroupBox;
    GroupBox4: TGroupBox;
    GroupBox5: TGroupBox;
    GroupBox6: TGroupBox;
    GroupBox7: TGroupBox;
    GroupBox8: TGroupBox;
    GroupBox9: TGroupBox;
    Label1: TLabel;
    Label10: TLabel;
    Label11: TLabel;
    Label12: TLabel;
    Label13: TLabel;
    Label14: TLabel;
    Label17: TLabel;
    Label18: TLabel;
    Label19: TLabel;
    Label20: TLabel;
    Label21: TLabel;
    Label22: TLabel;
    Label23: TLabel;
    Label24: TLabel;
    Label25: TLabel;
    Label26: TLabel;
    Label27: TLabel;
    Label28: TLabel;
    Label29: TLabel;
    Label43: TLabel;
    Label57: TLabel;
    lbClientActualResidence: TLabel;
    lbClientIdentityCard: TLabel;
    lbClientRegistration: TLabel;
    lbContractInfo: TLabel;
    lblEndService: TLabel;
    lblStartService: TLabel;
    lbMClientActualResidence: TLabel;
    lbMClientIdentityCard: TLabel;
    lbMClientRegistration: TLabel;
    lbServiceInfo: TLabel;
    Label2: TLabel;
    Label3: TLabel;
    Label4: TLabel;
    Label5: TLabel;
    Label6: TLabel;
    Label7: TLabel;
    Label8: TLabel;
    Label9: TLabel;
    cbBrigade: TComboBox;
    cbCities: TComboBox;
    cbEquipment: TComboBox;
    cbHouses: TComboBox;
    cbMounting: TComboBox;
    cbStreets: TComboBox;
    cbClients: TComboBox;
    cbMClients: TComboBox;
    cbMaintenanceContract: TComboBox;
    cbPaymentTypes: TComboBox;
    memoShowDebtors: TRichMemo;
    MenuItem1: TMenuItem;
    MenuItem2: TMenuItem;
    MenuItem3: TMenuItem;
    MenuItem4: TMenuItem;
    MenuItem5: TMenuItem;
    mnuContractInstall: TMenuItem;
    mnuContractService: TMenuItem;
    pcCard: TPageControl;
    pmApartments: TPopupMenu;
    pmContracts: TPopupMenu;
    pmShowDebtors: TPopupMenu;
    pmIncrYear: TPopupMenu;
    sbnReceiptPrinting: TSpeedButton;
    sbnLoadCostPayments: TSpeedButton;
    sbnShowLog: TSpeedButton;
    tsSeniorMaintenance: TTabSheet;
    tsMainTenance: TTabSheet;
    tsSeniorContract: TTabSheet;
    tsMain: TTabSheet;
    tsAdditionally: TTabSheet;
    procedure actBuildListExecute(Sender: TObject);
    procedure actBuildListUpdate(Sender: TObject);
    procedure actClearListExecute(Sender: TObject);
    procedure actClearListUpdate(Sender: TObject);
    procedure actClearPaymentsExecute(Sender: TObject);
    procedure actCopyTextExecute(Sender: TObject);
    procedure actCopyTextUpdate(Sender: TObject);
    procedure actCreateFineExecute (Sender : TObject );
    procedure actDelApartmentExecute(Sender: TObject);
    procedure actDelApartmentUpdate(Sender: TObject);
    procedure actIncrYearExecute(Sender: TObject);
    procedure actInsApartmentExecute(Sender: TObject);
    procedure actInsApartmentUpdate(Sender: TObject);
    procedure actPaymentsHistoryExecute(Sender: TObject);
    procedure bnAddCityClick(Sender: TObject);
    procedure bnAddClientClick(Sender: TObject);
    procedure bnAddHouseClick(Sender: TObject);
    procedure bnAddStreetClick(Sender: TObject);
    procedure bnBrigadeNotSelectedClick(Sender: TObject);
    procedure bnCityNotSelectedClick(Sender: TObject);
    procedure bnContractsClick(Sender: TObject);
    procedure bnEquipmentNotSelectedClick(Sender: TObject);
    procedure bnHouseNotSelectedClick(Sender: TObject);
    procedure bnMountingNotSelectedClick(Sender: TObject);
    procedure bnOKClick(Sender: TObject);
    procedure bnRefreshCitiesClick(Sender: TObject);
    procedure bnRefreshHousesClick(Sender: TObject);
    procedure bnRefreshStreetsClick(Sender: TObject);
    procedure bnSaveClick(Sender: TObject);
    procedure bnStreetNotSelectedClick(Sender: TObject);
    procedure bnVerifyContractClick(Sender: TObject);
    procedure cbBrigadeCloseUp(Sender: TObject);
    procedure cbBrigadeEditingDone(Sender: TObject);
    procedure cbCitiesChange(Sender: TObject);
    procedure cbCitiesChangeBounds(Sender: TObject);
    procedure cbCitiesCloseUp(Sender: TObject);
    procedure cbCitiesEditingDone(Sender: TObject);
    procedure cbClientsCloseUp(Sender: TObject);
    procedure cbClientsEditingDone(Sender: TObject);
    procedure cbEquipmentCloseUp(Sender: TObject);
    procedure cbEquipmentEditingDone(Sender: TObject);
    procedure cbHousesCloseUp(Sender: TObject);
    procedure cbHousesEditingDone(Sender: TObject);
    procedure cbMaintenanceContractCloseUp(Sender: TObject);
    procedure cbMaintenanceContractEditingDone(Sender: TObject);
    procedure cbMClientsChange(Sender: TObject);
    procedure cbMClientsCloseUp(Sender: TObject);
    procedure cbMClientsEditingDone(Sender: TObject);
    procedure cbMountingCloseUp(Sender: TObject);
    procedure cbMountingEditingDone(Sender: TObject);
    procedure cbPaymentTypesEditingDone(Sender: TObject);
    procedure cbStreetsCloseUp(Sender: TObject);
    procedure cbStreetsEditingDone(Sender: TObject);
    procedure chOnePersonChange(Sender: TObject);
    procedure dtCreateDateAcceptDate(Sender: TObject; var ADate: TDateTime;
      var AcceptDate: Boolean);
    procedure dtCreateDateChange(Sender: TObject);
    procedure dtCreateDateEditingDone(Sender: TObject);
    procedure dtStartServiceChange(Sender: TObject);
    procedure FormActivate(Sender: TObject);
    procedure FormCloseQuery(Sender: TObject; var CanClose: boolean);
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure frApartmentsEnterRect(Memo: TStringList; View: TfrView);
    procedure frApartmentsGetValue(const ParName: String; var ParValue: Variant
      );
    procedure grdApartmentsCellClick(Column: TxColumn; CellPos: TCellCursorPos);
    procedure grdApartmentsDrawColumnCell(Sender: TObject; const Rect: TRect;
      DataCol: integer; Column: TxColumn; State: TxGridDrawState);
    procedure memoShowDebtorsMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Integer);
    procedure mnuContractInstallClick(Sender: TObject);
    procedure mnuContractServiceClick(Sender: TObject);
    procedure sbnLoadCostPaymentsClick(Sender: TObject);
    procedure sbnReceiptPrintingClick(Sender: TObject);
    procedure sbnShowLogClick(Sender: TObject);
  private
    { private declarations }
    FOldContractNumber: Integer;
    FOldProlongedContract: string;
    FBackupCard: TCard;
    //
    FApartments: TMemDataset;
    FOldApartments: TMemDataset;
    FQryCities: TZQuery;
    FCard: TCard;
    FQRCode: TDelphiZXingQRCode;
    PB: TBitmap;
    FCurrentOperation: TCurrentOperation;
    FDeleteApartments: TMemDataset;
    FLastCardID: Integer;
    FClearIndicationPayments: Boolean; // Очистить признак платежей
    FCityPhone: string;
    FLink: string;
    FOfficeAddress: string;
    FCostOfConnection: Currency;
    FIsShowWarning: Boolean;
    FQryCountOfFines: TZQuery;

    FPrevStartService: TDateTime;
    FPrevStartStr: string;
    FPrevEndService: TDateTime;
    FPrevNormalPayment: Currency;
    FPrevPrivilegePayment: Currency;

    private frmPaymentsHistory: TfmPaymentsHistory;

    procedure LoadRefs;
    procedure addCities;
    procedure addStreetByDefault;
    procedure addStreets(CityID: Integer);
    procedure addHouseByDefault();
    procedure addHouses(StreetID: Integer);
    procedure addClients(ClientID: Integer);
    procedure addMClients(ClientID: Integer);
    procedure SaveHistory;
    procedure SaveCard(AValue: Integer);
    function Passport(ID: Integer): string;
    function Residence(ID: Integer; ResidenceType: Integer): string;
    function GetPhones(ID: Integer): string;
    procedure ShowDebtors;
    function ClearEquipment: Boolean;
    function ClearCity: Boolean;
    function ClearStreet: Boolean;
    function ClearHouse: Boolean;
    function ClearBrigade: Boolean;
    function ClearMounting: Boolean;
    procedure ChangeClientEx(IsEdit: Boolean; ID: Integer; ATag: Integer);
    procedure ShowClientInfo(ID: Integer);
    procedure ShowMClientInfo(ID: Integer);
    procedure ShowHistory;
    procedure ClearPayments;
    procedure myApartmentsDataChange(Sender: TObject; Field: TField);
    procedure Sort;
    function Checked: Boolean;
    function IsCheckedCode(AValue: string): Boolean;
    function IsValidDate(ADate: TDateTime): Boolean;
    procedure DocumentStatus;
    procedure ApplyUpdates;
    procedure SaveData(AValue: Integer);
    property CurrentOperation: TCurrentOperation read FCurrentOperation write FCurrentOperation;
    procedure MyMessageHandler(var Message: TLMessage); message MESSAGE_FROM_SERVER;
    procedure LoadApartments(CardID: Integer);
    procedure CheckPayments(CardID: Integer);
    procedure RefreshCostPayments(CityID: Integer);
  public
    { public declarations }
    property Card: TCard read FCard write FCard;
    property LastCardID: Integer read FLastCardID;
    procedure LoadData;
  end;

var
  fmNewCard: TfmNewCard;

implementation

uses
  fDM, LCLType, fLog, variants, uUtils, DateUtils, Main, QRGraphics, QR_Win1251, QR_URL, Math,
  Process, ActiveX, comobj, ShellApi,
  fApartment, fCity, fStreet, fHouse, fClientEx, fSplash, StrUtils,
  fShortFine, Clipbrd;

const cNoData = 'Нет данных';

{$R *.lfm}

{ TfmNewCard }

function IsChecked(const Value: Boolean): string;
begin
  Result := 'Включен';
  if (not Value) then
    Result := 'Выключен';
end;

procedure TfmNewCard.bnSaveClick(Sender: TObject);
//var
//  fmSplash: TfmSplash;
begin
  //if not Checked then Exit;
  //fmSplash := TfmSplash.Create(Application);
  //fmSplash.lbTitle.Caption := 'Сохранение данных';
  //fmSplash.Show;
  //fmSplash.Update;
  //Application.ProcessMessages;
  //
  //SaveHistory;
  //ApplyUpdates;
  //SaveCard(0);
  //
  //fmSplash.Free;

  SaveData(TButton(Sender).Tag);
end;

procedure TfmNewCard.bnStreetNotSelectedClick(Sender: TObject);
begin
  FCard.StreetID := 0;
  FCard.HouseID := 0;
  //
  ClearStreet;
  addHouseByDefault;
end;

procedure TfmNewCard.bnVerifyContractClick(Sender: TObject);
var
  OriginalContractNumber, VerifyContract: Integer;
  qryText: TZReadOnlyQuery;
  IsDuplicates: Boolean;
begin
  if (Length(Trim(edContractNumber.Text)) > 0) then begin
    if (TryStrToInt(edContractNumber.Text, VerifyContract)) then begin
      if (VerifyContract = 0) then begin
        Application.MessageBox('Номер договора ТО должен быть больше 0 или пустым!', 'Предупреждение', MB_ICONWARNING + MB_OK);
        Exit;
      end;

      qryText := TZReadOnlyQuery.Create(nil);
      qryText.Connection := DM.DBConn;
      try
        qryText.Close;
        qryText.SQL.Text := 'SELECT a.contract_number, a.m_contract_number';
        qryText.SQL.Add('FROM cards a');
        qryText.SQL.Add(Format('WHERE (a.m_contract_number = %d)', [VerifyContract]));
        qryText.SQL.Add(Format('AND (a.maintenance_contract = %d)', [1]));
        qryText.Open;

        IsDuplicates := False;
        if (not qryText.IsEmpty) then begin
          repeat
            if (qryText.FieldByName('contract_number').AsInteger <> FCard.ContractNumber) then begin
              OriginalContractNumber := qryText.FieldByName('contract_number').AsInteger;
              IsDuplicates := True;
              Break;
            end;
            qryText.Next;
          until qryText.EOF;
        end;

      finally
        qryText.Free;
      end;

      if (IsDuplicates) then begin
        Application.MessageBox(PChar(Format('Такой номер договора ТО уже есть в договоре № %d!', [OriginalContractNumber])), 'Предупреждение', MB_ICONWARNING + MB_OK);
      end
      else begin
        Application.MessageBox('Дубликата нет. Все ОК!', 'Информация', MB_ICONINFORMATION + MB_OK);
      end;

    end
    else begin
      Application.MessageBox('Номер договора ТО не является числом!', 'Предупреждение', MB_ICONWARNING + MB_OK);
    end;
  end;
end;

procedure TfmNewCard.cbBrigadeCloseUp(Sender: TObject);
begin
  FCard.BrigadeID := Integer(TComboBox(Sender).Items.Objects[TComboBox(Sender).ItemIndex]);
end;

procedure TfmNewCard.cbBrigadeEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
end;

procedure TfmNewCard.cbCitiesChange(Sender: TObject);
begin
  //Caption := 'Fcard.cityid = ' + IntToStr(FCard.CityID);
end;

procedure TfmNewCard.cbCitiesChangeBounds(Sender: TObject);
begin
  //Caption := 'Fcard.cityid = ' + IntToStr(FCard.CityID);
end;

procedure TfmNewCard.cbCitiesCloseUp(Sender: TObject);
var
  NewCityID: Integer;
  V, IsFound: Variant;
begin
  // Меняем город. Проверяем, улицы соответствуют городу?
  NewCityID := Integer(TComboBox(Sender).Items.Objects[TComboBox(Sender).ItemIndex]);
  if (NewCityID <> FCard.CityID) then begin
    if (NewCityID = 0) then begin
      FCard.StreetID := 0;
      FCard.HouseID := 0;
      addStreetByDefault;
      addHouseByDefault;
    end
    else begin
      IsFound := DM.qryStreets.Lookup('street_id', FCard.StreetID, 'city_id');
      if (not VarIsNull(IsFound)) then begin
        if Integer(IsFound) <> NewCityID then begin

          FCard.CityID := NewCityID;
          FCard.StreetID := 0;
          FCard.HouseID := 0;

          addStreets(FCard.CityID);
          addHouseByDefault;

          V := DM.qryCities.Lookup('city_id', FCard.CityID, 'normal_payment;privilege_payment');
          if (not(VarIsNull(V))) then begin
            //edNormalPayment.Value := CurrToStrF(V[0], ffFixed, 2);
            //edPrivilegePayment.Value := CurrToStrF(V[1], ffFixed, 2);
            edNormalPayment.Value := V[0];
            edPrivilegePayment.Value := V[1];
          end;

        end;
      end;
    end;
  end;
  //ShowMessage(IntToStr(FCard.CityID));
end;

procedure TfmNewCard.cbCitiesEditingDone(Sender: TObject);
begin
  //Caption := 'Fcard.cityid = ' + IntToStr(FCard.CityID);
  //cbCities.ItemIndex := cbCities.Items.IndexOf(cbCities.Text);
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
  //Caption := 'Fcard.cityid = ' + IntToStr(FCard.CityID);
end;

procedure TfmNewCard.cbClientsCloseUp(Sender: TObject);
begin
  FCard.ClientID := Integer(cbClients.Items.Objects[cbClients.ItemIndex]);
  //chOnePerson.Checked := Integer(cbClients.Items.Objects[cbClients.ItemIndex]) = Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);
  chOnePerson.Checked := FCard.ClientID = FCard.MClientID;
  ShowClientInfo(FCard.ClientID);
end;

procedure TfmNewCard.cbClientsEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
  //chOnePerson.Checked := Integer(cbClients.Items.Objects[cbClients.ItemIndex]) = Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);
  chOnePerson.Checked := FCard.ClientID = FCard.MClientID;
end;

procedure TfmNewCard.cbEquipmentCloseUp(Sender: TObject);
var
  NewEquipmentID, QuaranteePeriod: Integer;
  IsFind: Variant;
begin
  NewEquipmentID := Integer(TComboBox(Sender).Items.Objects[TComboBox(Sender).ItemIndex]);
  if (NewEquipmentID <> FCard.EquipmentID) then begin
    FCard.EquipmentID := NewEquipmentID;
    if (FCard.EquipmentID = 0) then begin
      dtEndContract.Text := '';
    end
    else begin
        // Проверить дату!
        IsFind := DM.qryEquipments.Lookup('equipment_id', FCard.EquipmentID, 'guarantee_period');
        if not VarIsNull(IsFind) then
          QuaranteePeriod := Integer(IsFind);
        dtEndContract.Date := IncMonth(dtCreateDate.Date, 12 * QuaranteePeriod);
    end;
  end;
end;

procedure TfmNewCard.cbEquipmentEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
end;

procedure TfmNewCard.cbHousesCloseUp(Sender: TObject);
var
  NewHouseID: Integer;
begin
  NewHouseID := Integer(TComboBox(Sender).Items.Objects[TComboBox(Sender).ItemIndex]);
  if (NewHouseID <> FCard.HouseID) then begin
    FCard.HouseID := NewHouseID;
  end;
end;

procedure TfmNewCard.cbHousesEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
end;

procedure TfmNewCard.cbMaintenanceContractCloseUp(Sender: TObject);
begin
  case cbMaintenanceContract.ItemIndex of
    0:
      begin
        dtStartService.Enabled := False;
        dtEndService.Enabled := False;
        lblStartService.Enabled := False;
        lblEndService.Enabled := False;
      end;
    1:
      begin
        dtStartService.Enabled := True;
        dtStartService.ReadOnly := dtStartService.Text <> '';

        dtEndService.Enabled := False;
        lblStartService.Enabled := True;
        lblEndService.Enabled := True;
      end;
    2:
      begin
        dtStartService.Enabled := False;
        dtEndService.Enabled := False;
        lblStartService.Enabled := True;
        lblEndService.Enabled := True;
      end;
  end;
end;

procedure TfmNewCard.cbMaintenanceContractEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
end;

procedure TfmNewCard.cbMClientsChange(Sender: TObject);
begin
  cbMClientsCloseUp(Sender);
end;

procedure TfmNewCard.cbMClientsCloseUp(Sender: TObject);
begin
  FCard.MClientID := Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);
  //chOnePerson.Checked := Integer(cbClients.Items.Objects[cbClients.ItemIndex]) = Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);
  chOnePerson.Checked := FCard.ClientID = FCard.MClientID;
  ShowMClientInfo(FCard.MClientID);
end;

procedure TfmNewCard.cbMClientsEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
  //chOnePerson.Checked := Integer(cbClients.Items.Objects[cbClients.ItemIndex]) = Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);
  chOnePerson.Checked := FCard.ClientID = FCard.MClientID;
end;

procedure TfmNewCard.cbMountingCloseUp(Sender: TObject);
begin
  FCard.Mounting := Integer(TComboBox(Sender).Items.Objects[TComboBox(Sender).ItemIndex]);
end;

procedure TfmNewCard.cbMountingEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
end;

procedure TfmNewCard.cbPaymentTypesEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
end;

procedure TfmNewCard.cbStreetsCloseUp(Sender: TObject);
var
  NewStreetID: Integer;
  IsFound: Variant;
  Test: Integer;
begin
  NewStreetID := Integer(TComboBox(Sender).Items.Objects[TComboBox(Sender).ItemIndex]);
  if (NewStreetID <> FCard.StreetID) then begin
    if (NewStreetID = 0) then begin
      FCard.HouseID := 0;
      addHouseByDefault;
    end
    else begin
      IsFound := DM.qryHouses.Lookup('house_id', FCard.HouseID, 'street_id');
      if (not VarIsNull(IsFound)) then begin
        if Integer(IsFound) <> NewStreetID then begin

          FCard.StreetID := NewStreetID;
          FCard.HouseID := 0;

          addHouses(FCard.StreetID);

        end;
      end;
    end;
  end;
  //ShowMessage(IntToStr(FCard.StreetID));
end;

procedure TfmNewCard.cbStreetsEditingDone(Sender: TObject);
begin
  TComboBox(Sender).ItemIndex := TComboBox(Sender).Items.IndexOf(TComboBox(Sender).Text);
end;

procedure TfmNewCard.chOnePersonChange(Sender: TObject);
begin
 if TDBCheckBox(Sender).Checked then begin
    FCard.MClientID := FCard.ClientID;
  end
  else begin
    //FCard.MClientID := 0;
  end;
  addMClients(FCard.MClientID);
  ShowMClientInfo(FCard.MClientID);
end;

procedure TfmNewCard.dtCreateDateAcceptDate(Sender: TObject;
  var ADate: TDateTime; var AcceptDate: Boolean);
begin
  if AcceptDate then begin
    try
      dtCreditTo.Date := IncMonth(ADate, 4);
    except
    end;
  end;
end;

procedure TfmNewCard.dtCreateDateChange(Sender: TObject);
begin
  try
    dtCreditTo.Date := IncMonth(dtCreateDate.Date, 4);
  except
  end;
end;

procedure TfmNewCard.dtCreateDateEditingDone(Sender: TObject);
begin
  //dtCreditTo.Date := IncMonth(dtCreateDate.Date, 4);
end;

procedure TfmNewCard.dtStartServiceChange(Sender: TObject);
var
  I: Integer;
begin
  dtEndService.Date := DateUtils.IncYear(dtStartService.Date);
  dtProlongation.Date := DateUtils.IncYear(dtStartService.Date);
end;

procedure TfmNewCard.FormActivate(Sender: TObject);
var
  NormalPayment, PrivilegePayment: Currency;
  sWarning: string;
begin
  DM.mdsApartments.OnDataChange := @myApartmentsDataChange;
  ShowDebtors;

  cbMaintenanceContractCloseUp(cbMaintenanceContract);

  //if ((not FIsShowWarning) and (FCard.CardID > 0)) then begin
  //  FIsShowWarning := True;
  //  DM.qryCostPayments.Close;
  //  DM.qryCostPayments.ParamByName('city_id').AsInteger := FCard.CityID;
  //  DM.qryCostPayments.Open;
  //  if (not DM.qryCostPayments.IsEmpty) then begin
  //    NormalPayment := DM.qryCostPayments.FieldByName('normal_payment').AsCurrency;
  //    PrivilegePayment := DM.qryCostPayments.FieldByName('privilege_payment').AsCurrency;
  //    sWarning := '';
  //    if (edNormalPayment.Value <> NormalPayment) then begin
  //      sWarning := Format('Обычная плата: %.2f, по умолчанию: %.2f', [edNormalPayment.Value, NormalPayment]);
  //    end;
  //    if (edPrivilegePayment.Value <> PrivilegePayment) then begin
  //      if (Length(Trim(sWarning)) > 0) then begin
  //        sWarning := sWarning + Chr(13) + Chr(10);
  //      end;
  //      sWarning := sWarning + Format('Льготная плата: %.2f, по умолчанию: %.2f', [edPrivilegePayment.Value, PrivilegePayment]);;
  //    end;
  //    if (Length(Trim(sWarning)) > 0) then begin
  //      sWarning := 'Проверьте реквизиты!' + Chr(13) + Chr(10) + sWarning;
  //      Application.MessageBox(PChar(Format('%s', [sWarning])), 'Предупреждение', MB_ICONWARNING + MB_OK);
  //    end;
  //  end;
  //end
end;

procedure TfmNewCard.FormCloseQuery(Sender: TObject; var CanClose: boolean);
begin
  if (FClearIndicationPayments) then begin
    if (Application.MessageBox('Вы очистили платежи по квартирам. Закрыть договор без сохранения данных?', 'Вопрос', MB_ICONQUESTION + MB_YESNO)) = IDNO then
      CanClose := False;
  end;
end;

procedure TfmNewCard.FormCreate(Sender: TObject);
begin
  Inherited;

  FQryCountOfFines := TZQuery.Create(nil);
  FQryCountOfFines.Connection := DM.DBConn;

  FIsShowWarning := False;
  FBackupCard := nil;
  FClearIndicationPayments := False;

  FDeleteApartments := TMemDataset.Create(nil);
  FDeleteApartments.FieldDefs.Add('apartment_id', ftInteger);
  FDeleteApartments.Open;

  PB := nil;
  FQRCode := nil;

  PB := Graphics.TBitmap.Create;
  PB.Width := 116;
  PB.Height := 116;
  PB.Canvas.Brush.Color := clWhite;
  PB.Canvas.Pen.Color := clBlack;
  PB.Canvas.FillRect(0, 0, PB.Width, PB.Height);

  FQRCode := TDelphiZXingQRCode.Create;
  FQRCode.RegisterEncoder(ENCODING_WIN1251, TWin1251Encoder);
  FQRCode.RegisterEncoder(ENCODING_URL, TURLEncoder);

  //FTestCount := 0;

  //FQRCode.Data := 'Hello, world';

  //if (fMain.IntercomsSettings.PrintReceipts = 0) then
    FQRCode.Encoding := 0;
  //else
  //  FQRCode.Encoding := 4; // utf8 no BOM     0; // Auto  7; // 0 Windows 1251

  //FQRCode.Encoding := 5; // utf8 BOM     0; // Auto  7; // 0 Windows 1251
  FQRCode.ErrorCorrectionOrdinal := TErrorCorrectionOrdinal(1); // 0..3
  FQRCode.QuietZone := 0;
end;

procedure TfmNewCard.FormDestroy(Sender: TObject);
begin
  //if Assigned(FBackupCard) then begin
  //  FBackupCard.Free;
    FBackupCard := nil;
  //end;

  if Assigned(FQryCountOfFines) then begin
    FQryCountOfFines.Free;
    FQryCountOfFines := nil;
  end;

  if Assigned(frmPaymentsHistory) then begin
    frmPaymentsHistory.Free;
    frmPaymentsHistory := nil;
  end;

  if Assigned(FQRCode) then
    FQRCode.Free;
  if Assigned(PB) then
    PB.Free;
  if Assigned(FApartments) then begin
    FApartments.Clear;
    FApartments.Close;
    FApartments.Free;
  end;
  if Assigned(FQryCities) then begin
    FQryCities.Free;
    FQryCities := nil;
  end;
  if Assigned(FDeleteApartments) then begin
    FDeleteApartments.Close;
    FDeleteApartments.Clear;
    FDeleteApartments.Free;
  end;
  if Assigned(FOldApartments) then begin
    FOldApartments.Close;
    FOldApartments.Clear;
    FOldApartments.Free;
  end;
end;

procedure TfmNewCard.frApartmentsEnterRect(Memo: TStringList; View: TfrView);
var
  S, FullAddress, Letter, Apartment: string;
  I: Integer;
  stName, stPersonalAcc, stBankName, stBIC, stCorrespAcc, stTechCode, stCategory, stPurpose: string;
  DOW, Day, Month, Year: Word;
  Sum: Longint;
  ST: TStringList;
  MemoName: string;
  fullPayment, Dolg: Currency;
begin

  fullPayment := 0;
  Dolg := 0;
  try
    if DM.mFilterApartments.FieldByName('privilege').AsInteger = 0 then begin
      fullPayment := edNormalPayment.Value;

      Dolg := FPrevNormalPayment - DM.mFilterApartments.FieldByName('prev_payment').AsCurrency;
    end
    else begin
      fullPayment := edPrivilegePayment.Value;

      Dolg := FPrevPrivilegePayment - DM.mFilterApartments.FieldByName('prev_payment').AsCurrency;
    end;
  except
    //
  end;

  fullPayment := fullPayment + Dolg;

  //
  if View is TfrMemoView then begin
    MemoName := TfrMemoView(View).Name;
    // Получатель
    if (MemoName = 'Memo1')then begin
      TfrMemoView(View).Memo.Text := Format('%s %s', ['ООО «ДОМОФОН-СЕРВИС»', FCityPhone]);
    end;
    if (MemoName = 'Memo22') then begin
      TfrMemoView(View).Memo.Text := Format('%s %s %s', ['ООО «ДОМОФОН-СЕРВИС»', FCityPhone, FOfficeAddress]);
    end;

    if ((MemoName = 'Memo27') or (MemoName = 'Memo28')) then begin
      TfrMemoView(View).Memo.Text := Format('%s', [FLink]);
    end;
    if (MemoName = 'Memo57') then begin
      TfrMemoView(View).Memo.Text := Format('%s', [FOfficeAddress]);
    end;
    // Персональный счет (personal_account)
    if ((MemoName = 'Memo53') or (MemoName = 'Memo55')) then begin
      //TfrMemoView(View).Memo.Text := Format('%0.7d%0.1d%0.3d', [StrToInt(FCard.MContractNumber), DM.mFilterApartments.FieldByName('letter').AsInteger, DM.mFilterApartments.FieldByName('number').AsInteger]);
      TfrMemoView(View).Memo.Text := uUtils.GetPersonalAccount(
        edContractNumber.Text,
        DM.mFilterApartments.FieldByName('letter').AsInteger,
        DM.mFilterApartments.FieldByName('number').AsInteger,
        chDuplicateMaintenance.Checked
      );
    end;
    // Полный адрес (FullAddress)
    if ((MemoName = 'Memo5') or (MemoName = 'Memo15')) then begin
      S := Format('г. %s, ул. %s, д. %s', [cbCities.Text, cbStreets.Text, cbHouses.Text]);
      if not FApartments.IsEmpty then begin
        Letter := EncodeApartmentLetter(DM.mFilterApartments.FieldByName('letter').AsInteger);
        Apartment := Format(', кв. %s%s', [DM.mFilterApartments.FieldByName('number').AsString, Letter]);
        S := S + Apartment;
      end;
      TfrMemoView(View).Memo.Text := S;
    end;
    // Описание оплаты (TextPayment)
    if ((MemoName = 'Memo37') or (MemoName = 'Memo49')) then begin
      if (chConnection.Checked) then begin
        TfrMemoView(View).Memo.Text := Format('Оплата за подключение домофона (Договор № %s)', [edContractNumber.Text]);
      end
      else begin
        TfrMemoView(View).Memo.Text := Format('Оплата за обслуживание домофона с %s по %s г., (Договор № %s)', [dtStartService.Text, dtEndService.Text, edContractNumber.Text]);
      end;
    end;
    // Дата оплаты (PayUpToDate)
    // if ((MemoName = 'Memo28') or (MemoName = 'Memo2')) then begin
    if (MemoName = 'Memo2') then begin
      TfrMemoView(View).Visible := not chConnection.Checked;
      if (chConnection.Checked) then begin
        TfrMemoView(View).Memo.Text := '';
      end
      else begin
        TfrMemoView(View).Memo.Text := Format('ОПЛАТИТЬ ДО %s г.', [DateToStr(IncDay(dtStartService.Date, fMain.IntercomsSettings.CountDaysForPayments))]);
      end;
    end;
    // Сумма оплаты (PaySumma)
    if ((MemoName = 'Memo26') or (MemoName = 'Memo18')) then begin
      if DM.mFilterApartments.FieldByName('privilege').AsInteger = 0 then
        S := uUtils.ExtReplace(Format('%f', [edNormalPayment.Value]), ',', '.')
      else
        S := uUtils.ExtReplace(Format('%f', [edPrivilegePayment.Value]), ',', '.');

      TfrMemoView(View).Memo.Text := S;
    end;

    // Задолженность
    if (MemoName = 'Memo11') then begin
      S := uUtils.ExtReplace(Format('%f', [Dolg]), ',', '.');
      TfrMemoView(View).Memo.Text := S;
    end;

    // К оплате
    if (MemoName = 'Memo12') then begin
      TfrMemoView(View).Memo.Text := uUtils.ExtReplace(Format('%f', [fullPayment]), ',', '.');;
    end;

    if (MemoName = 'Memo6') then begin
      S := FCityPhone;
      I := Pos(')', S);
      if (I > 0) then begin
        Delete(S, 1, I);
        S := Trim(S);
      end;
      TfrMemoView(View).Memo.Text := Format('Тел. %s', [S]);
    end;
  end;

  if (MemoName = 'Memo18') then begin
    S := uUtils.ExtReplace(Format('%f', [fullPayment]), ',', '.');
    S := 'К оплате ' + S + ' руб.';
    TfrMemoView(View).Memo.Text := S;
  end;

  if (MemoName = 'Memo39') then begin
    S := Format('Задолженность за период с %s по %s, руб.', [FPrevStartStr, dtStartService.Text]);
    TfrMemoView(View).Memo.Text := S;
  end;

  if (View is TfrPictureView) and (TfrPictureView(View).Name = 'Picture1') then begin

    //stName := 'ООО "Домофон-Сервис"';
    //stPersonalAcc := '40702810351000104846';
    //stBankName := 'Отделение № 8630 Сбербанка России, г. Псков';
    //stBIC := '045805602';
    //stCorrespAcc := '30101810300000000602';
    //stTechCode := '02';
    //stCategory := '1863000099';
    //
    //stPurpose := 'Оплата квитанции';
    //
    //// Win1251
    //FQRCode.Data := 'ST00011' + '|';
    ////FQRCode.Data := 'ST00012' + '|';
    //
    //// Обязательные реквизиты
    //FQRCode.Data := FQRCode.Data + 'Name=' + stName + '|'; // Наименование получателя
    //FQRCode.Data := FQRCode.Data + 'PersonalAcc=' + stPersonalAcc + '|'; // Номер счета получателя платежа
    //FQRCode.Data := FQRCode.Data + 'BankName=' + stBankName + '|'; // Наименование банка получателя платежа
    //FQRCode.Data := FQRCode.Data + 'BIC=' + stBIC + '|'; // БИК
    //FQRCode.Data := FQRCode.Data + 'CorrespAcc=' + stCorrespAcc + '|'; // Номер кор./сч. банка получателя платежа
    //// Дополнительные реквизиты
    //FQRCode.Data := FQRCode.Data + 'PayeeINN=' + '6027089952' + '|';  // ИНН получателя
    //FQRCode.Data := FQRCode.Data + 'PayerAdress=';                   // Адрес получателя
    //
    //FullAddress := Format('г. %s  ул. %s, д. %s', [lcbCities.Text, lcbStreets.Text, lcbHouses.Text]);
    //if not fMain.FApartments.IsEmpty then begin
    //  Letter := EncodeApartmentLetter(DM.mFilterApartments.FieldByName('letter').AsInteger);
    //  Apartment := Format(' кв. %s%s', [DM.mFilterApartments.FieldByName('number').AsString, Letter]);
    //  FullAddress := FullAddress + Apartment;
    //end;
    //FQRCode.Data := FQRCode.Data + FullAddress + '|';
    //
    //FQRCode.Data := FQRCode.Data + 'TechCode=' + stTechCode + '|'; // технический код
    //FQRCode.Data := FQRCode.Data + 'Category=' + stCategory + '|'; // Вид платежа
    //FQRCode.Data := FQRCode.Data + 'Purpose=' + stPurpose + '|'; // Наименование платежа (назначение)
    //
    //DecodeDateFully(dtProlongation.Date, Year, Month, Day, DOW);
    //
    //FQRCode.Data := FQRCode.Data + 'PaymPeriod=' + Format('%0.2d%0.2d', [Month, Year - 2000]) + '|'; // Период оплаты
    //FQRCode.Data := FQRCode.Data + 'PersAcc=' + Format('%0.7d%0.1d%0.3d', [DM.qryCards.FieldByName('m_contract_number').AsInteger, DM.mFilterApartments.FieldByName('letter').AsInteger, DM.mFilterApartments.FieldByName('number').AsInteger]) + '|'; // Лицевой счет бюджетного получателя
    //
    //FQRCode.Data := FQRCode.Data + 'Sum=';
    //if DM.mFilterApartments.FieldByName('privilege').AsInteger = 0 then
    //  Sum := Floor(DM.qryCards.FieldByName('normal_payment').AsCurrency * 100)
    //else
    //  Sum := Floor(DM.qryCards.FieldByName('privilege_payment').AsCurrency * 100);
    //FQRCode.Data := FQRCode.Data + IntToStr(Sum); // Сумма
    //
    //FQRCode.Data := Utf8ToAnsi(FQRCode.Data);
    //
    //FQRCode.Encoding := 7;


    // Данные
    stName := 'ООО "Домофон-Сервис"';
    stPersonalAcc := '40702810351000104846';
    stBankName := 'Отделение № 8630 Сбербанка России, г. Псков';
    stBIC := '045805602';
    stCorrespAcc := '30101810300000000602';

    stTechCode := '02';

    //stCategory := '1488003966'; // Новое
    stCategory := '1863000099'; // старое

    stPurpose := 'Оплата квитанции';

    // Win1251
    if (fMain.IntercomsSettings.PrintReceipts = 0) then
      FQRCode.Data := 'ST00011' + '|'
    else
      FQRCode.Data := 'ST00012' + '|';

    // Обязательные реквизиты
    FQRCode.Data := FQRCode.Data + 'Name=' + stName + '|'; // Наименование получателя
    FQRCode.Data := FQRCode.Data + 'PersonalAcc=' + stPersonalAcc + '|'; // Номер счета получателя платежа
    FQRCode.Data := FQRCode.Data + 'BankName=' + stBankName + '|'; // Наименование банка получателя платежа
    FQRCode.Data := FQRCode.Data + 'BIC=' + stBIC + '|'; // БИК
    FQRCode.Data := FQRCode.Data + 'CorrespAcc=' + stCorrespAcc + '|'; // Номер кор./сч. банка получателя платежа

    FQRCode.Data := FQRCode.Data + 'PersAcc=' + uUtils.GetPersonalAccount(edContractNumber.Text, DM.mFilterApartments.FieldByName('letter').AsInteger, DM.mFilterApartments.FieldByName('number').AsInteger, chDuplicateMaintenance.Checked) + '|'; // Лицевой счет бюджетного получателя
    FQRCode.Data := FQRCode.Data + 'Category=' + stCategory; // Вид платежа

    // Дополнительные реквизиты
    // 28.06.2019
    (*
    FQRCode.Data := FQRCode.Data + 'PayeeINN=' + '6027089952' + '|';  // ИНН получателя
    FQRCode.Data := FQRCode.Data + 'PayerAdress=';                   // Адрес получателя

    FullAddress := Format('г. %s  ул. %s, д. %s', [cbCities.Text, cbStreets.Text, cbHouses.Text]);
    if not FApartments.IsEmpty then begin
      Letter := EncodeApartmentLetter(DM.mFilterApartments.FieldByName('letter').AsInteger);
      Apartment := Format(' кв. %s%s', [DM.mFilterApartments.FieldByName('number').AsString, Letter]);
      FullAddress := FullAddress + Apartment;
    end;
    FQRCode.Data := FQRCode.Data + FullAddress + '|';
    *)

    // 28.06.2019
    (*
    FQRCode.Data := FQRCode.Data + 'TechCode=' + stTechCode + '|'; // технический код
    *)
    //FQRCode.Data := FQRCode.Data + 'Category=' + stCategory + '|'; // Вид платежа
    // 28.06.2019
    (*
    FQRCode.Data := FQRCode.Data + 'Purpose=' + stPurpose + '|'; // Наименование платежа (назначение)
    // 02 December 2015
    if (fMain.IntercomsSettings.PrintReceipts = 1) then
      FQRCode.Data := FQRCode.Data + 'AddAmount=' + '000' + '|'; //

    DecodeDateFully(dtProlongation.Date, Year, Month, Day, DOW);

    // 02 December 2015
    // Изменил период оплаты MMYY на MMYYYY
    //if (fMain.IntercomsSettings.PrintReceipts = 0) then
    //  FQRCode.Data := FQRCode.Data + 'PaymPeriod=' + Format('%0.2d%0.2d', [Month, Year - 2000]) + '|' // Период оплаты
    //else

    FQRCode.Data := FQRCode.Data + 'PaymPeriod=' + Format('%0.2d%0.4d', [Month, Year]) + '|'; // Период оплаты
    *)

    //FQRCode.Data := FQRCode.Data + 'PersAcc=' + Format('%0.7d%0.1d%0.3d', [StrToInt(FCard.MContractNumber), DM.mFilterApartments.FieldByName('letter').AsInteger, DM.mFilterApartments.FieldByName('number').AsInteger]) + '|'; // Лицевой счет бюджетного получателя
    //FQRCode.Data := FQRCode.Data + 'PersAcc=' + uUtils.GetPersonalAccount(edContractNumber.Text, DM.mFilterApartments.FieldByName('letter').AsInteger, DM.mFilterApartments.FieldByName('number').AsInteger, chDuplicateMaintenance.Checked) + '|'; // Лицевой счет бюджетного получателя

    // 28.06.2019
    (*
    FQRCode.Data := FQRCode.Data + 'Sum=';
    if DM.mFilterApartments.FieldByName('privilege').AsInteger = 0 then
      // 11.07.2018 16:37:57
      //Sum := Floor(FCard.NormalPayment * 100)
      Sum := Floor(edNormalPayment.Value * 100)
    else
      // 11.07.2018 16:37:57
      //Sum := Floor(FCard.PrivilegePayment * 100);
      Sum := Floor(edPrivilegePayment.Value * 100);

    FQRCode.Data := FQRCode.Data + IntToStr(Sum); // Сумма
    *)

    if (fMain.IntercomsSettings.PrintReceipts = 0) then begin
      FQRCode.Data := Utf8ToAnsi(FQRCode.Data);
      FQRCode.Encoding := 7;
    end
    else begin
      FQRCode.Encoding := 4;
    end;

    // with BOM
    //FQRCode.Encoding := 5;  //7;
    //FQRCode.Data := Ansi(FQRCode.Data);

    //if FTestCount = 0  then begin
    //  InputBox('11', '22', FQRCode.Data);
    //end;
    //Inc(FTestCount);

    //ST := TStringList.Create;
    //ST.Add(FQRCode.Data);
    //ST.SaveToFile('d:\111.txt');
    //ST.Free;
    //end;

    MakeBmp(PB, 1, FQRCode, clWhite, clBlack, 0);
    TfrPictureView(View).Picture.Bitmap.Assign(PB);
  end;

  //PB.Free;

  if View is TfrBarCodeView then begin
    S := Trim('6027089952');
    DecodeDateFully(dtProlongation.Date, Year, Month, Day, DOW);
    S := S + Format('%0.2d', [Month]);
    S := S + Format('%0.2d', [Year - 2000]);

    S := S + Format('%0.5d', [Trunc(fullPayment)]);

    //if DM.mFilterApartments.FieldByName('privilege').AsInteger = 0 then
    //  // 11.07.2018 16:54:22
    //  S := S + Format('%0.5d', [Trunc(edNormalPayment.Value)])
    //else
    //  // 11.07.2018 16:54:22
    //  S := S + Format('%0.5d', [Trunc(edPrivilegePayment.Value)]);

    S := S + Format('%0.2d', [0]);
    S := S + uUtils.GetPersonalAccount(
      edContractNumber.Text,
      DM.mFilterApartments.FieldByName('letter').AsInteger,
      DM.mFilterApartments.FieldByName('number').AsInteger,
      chDuplicateMaintenance.Checked
    );
    //S := S + Format('%0.7d', [StrToInt(edContractNumber.Text)]);
    //S := S + Format('%0.1d', [DM.mFilterApartments.FieldByName('letter').AsInteger]) + Format('%0.3d', [DM.mFilterApartments.FieldByName('number').AsInteger]);
    Memo.Text := S;
  end;
end;

procedure TfmNewCard.frApartmentsGetValue(const ParName: String;
  var ParValue: Variant);
const
  costOfConnection: String = 'ost_of_connection';
var
  Letter, Apartment: string;
  Len, Len2: Integer;
begin
  ////Exit;
  //Apartment := '';
  //
  ////ShowMessage(ParName);
  //if ParName = 'ullAddress' then begin
  ////if (Pos(ParName, 'FullAddress') > 0) then begin
  //  ParValue := Format('г. %s, ул. %s, д. %s', [cbCities.Text, cbStreets.Text, cbHouses.Text]);
  //  if not FApartments.IsEmpty then begin
  //    Letter := EncodeApartmentLetter(DM.mFilterApartments.FieldByName('letter').AsInteger);
  //    Apartment := Format(', кв. %s%s', [DM.mFilterApartments.FieldByName('number').AsString, Letter]);
  //    ParValue := ParValue + Apartment;
  //  end;
  //end;
  //
  //if ParName = 'TextPayment' then begin
  //  ParValue := Format('Оплата за обслуживание домофона с %s по %s г., (Договор № %s)', [dtStartService.Text, dtEndService.Text, edContractNumber.Text]);
  //end;
  //
  //if ParName = 'personal_account' then begin
  //  //ParValue := Format('%0.7d%0.4d', [DM.qryCards.FieldByName('contract_number').AsInteger, DM.mFilterApartments.FieldByName('number').AsInteger]);
  //  ParValue := Format('%0.7d%0.1d%0.3d', [FCard.MContractNumber, DM.mFilterApartments.FieldByName('letter').AsInteger, DM.mFilterApartments.FieldByName('number').AsInteger]);
  //end;
  //
  //if ParName = 'PaySumma' then begin
  //  if DM.mFilterApartments.FieldByName('privilege').AsInteger = 0 then
  //    //ParValue := uUtils.ExtReplace(Format('Сумма платежа %f руб.', [FCard.NormalPayment]), ',', '.')
  //    ParValue := uUtils.ExtReplace(Format('Сумма платежа %f руб.', [edNormalPayment.Value]), ',', '.')
  //  else
  //    //ParValue := uUtils.ExtReplace(Format('Сумма платежа %f руб.', [FCard.PrivilegePayment]), ',', '.');
  //    ParValue := uUtils.ExtReplace(Format('Сумма платежа %f руб.', [edPrivilegePayment.Value]), ',', '.');
  //end;
  //
  //if ParName = 'PayUpToDate' then begin
  //  //ParValue := Format('ОПЛАТИТЬ ДО %s г.', [DateToStr(IncDay(dtEndService.Date, 40))]);
  //  ParValue := Format('ОПЛАТИТЬ ДО %s г.', [DateToStr(IncDay(dtStartService.Date, fMain.IntercomsSettings.CountDaysForPayments))]);
  //end;
  //
  //if ParName = 'ecipient' then begin
  //  ParValue := Format('%s   %s', ['ООО «ДОМОФОН-СЕРВИС»', FCityPhone]);
  //end;

  Letter := Utf8Decode(ParName);
  Len := Length(ParName);
  Len2 := Length(Trim(Letter));

  if (Length(ParName) >= Length(costOfConnection)) then begin
    if ((StrUtils.LeftStr(ParName, Length(costOfConnection))) = costOfConnection) then begin
      ParValue :=  uutils.ExtReplace(Format('%f', [FCostOfConnection]), ',', '.');
    end;
  end;

end;

procedure TfmNewCard.grdApartmentsCellClick(Column: TxColumn;
  CellPos: TCellCursorPos);
begin
  if FApartments.RecordCount > 0 then begin
    if (Column.Index = 2) then begin
      if FApartments.FieldByName('paid').AsInteger = 1 then begin
        FApartments.FieldByName('half_paid').AsInteger := 0;
      end;
    end;
    if (Column.Index = 3) then begin
      if FApartments.FieldByName('privilege').AsInteger = 1 then begin
        FApartments.FieldByName('exempt').AsInteger := 0;
      end;
    end;
    if (Column.Index = 4) then begin
      if FApartments.FieldByName('exempt').AsInteger = 1 then begin
        FApartments.FieldByName('paid').AsInteger := 0;
        FApartments.FieldByName('privilege').AsInteger := 0;
      end;
    end;
    ShowDebtors;
  end;
end;

procedure TfmNewCard.grdApartmentsDrawColumnCell(Sender: TObject;
  const Rect: TRect; DataCol: integer; Column: TxColumn; State: TxGridDrawState
  );
begin
    // Переплата
  if (FApartments.FieldByName('paid').AsInteger = 1) and (FApartments.FieldByName('half_paid').AsInteger = 2) then
    TxDBGrid(Sender).Canvas.Brush.Color := RGBToColor(128, 230, 255);
  // Частичная оплата
  if (FApartments.FieldByName('paid').AsInteger = 1) and (FApartments.FieldByName('half_paid').AsInteger = 1) then
    TxDBGrid(Sender).Canvas.Brush.Color := RGBToColor(255, 255, 128);  // Желтоватый
  // Полная оплата
  if (FApartments.FieldByName('paid').AsInteger = 1) and (FApartments.FieldByName('half_paid').AsInteger = 0) then
    TxDBGrid(Sender).Canvas.Brush.Color := RGBToColor(183, 255, 183); // Зеленоватый

  //if (DataCol = 5) and (FApartments.FieldByName('paid').AsInteger = 0) then begin
  //  Column.Field.Text := '';
  //end;

  // Исключен от уплаты
  if FApartments.FieldByName('exempt').AsInteger = 1 then
    TxDBGrid(Sender).Canvas.Brush.Color := RGBToColor(255, 183, 183);
end;

procedure TfmNewCard.memoShowDebtorsMouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Integer);
begin
  if Button = mbRight then
    begin

    end;
end;

// Открыть файл договора на установку
procedure TfmNewCard.mnuContractInstallClick(Sender: TObject);
var
  NameFile: String;
  SS1, S, PathToTemplates, KW: string;
  //AProcess: TProcess;
  V, WB: Variant;
  W: WideString;
  qryClient: TZReadOnlyQuery;
begin
  WB := Null;

  NameFile := '';
  NameFile := Format('%s-1.doc', [edCardId.Text]);
  if Trim(fMain.IntercomsSettings.PathToReportsFiles) <> '' then
    NameFile := fMain.IntercomsSettings.PathToReportsFiles + DirectorySeparator + NameFile;

  //ShowMessage(NameFile);

  if FCurrentOperation = coOpenFile then begin
    if FileExists(NameFile) then begin
      //AProcess := TProcess.Create(nil);
      //AProcess.CommandLine := Format('cmd /c "%s"', [NameFile]);
      //AProcess.Execute;
      //AProcess.Free;
      //ShellExecute(Handle, 'open', PChar(NameFile), nil, nil, SW_SHOWNORMAL);
      //ShellExecute(Handle, 'open', PChar(WideString(NameFile)), nil, nil, SW_SHOWNORMAL);
      ShellExecute(Handle, 'open', PChar(Format('%s', [NameFile])), nil, nil, SW_SHOWNORMAL);
    end
    else
      Application.MessageBox(PChar(Format('Файл %s не существует!', [NameFile])), 'Предупреждение', MB_ICONWARNING + MB_OK);
  end
  else begin
    if Application.MessageBox('Вы действительно хотите сформировать договор?', 'Внимание', MB_ICONEXCLAMATION + MB_YESNO) = IDYES then begin
    try
      try
        PathToTemplates := ExtractFilePath(Application.Params[0]) + 'templates';
        V := DM.qryCities.Lookup('city_id',  FCard.CityID, 'print_type');
        if not VarIsNull(V) then begin
          if Integer(V) = 2 then
            W := Utf8Decode(PathToTemplates + DirectorySeparator + 'contract_01.dotx')
          else
            W := Utf8Decode(PathToTemplates + DirectorySeparator + 'contract_02.dotx');

          WB := CreateOleObject('Word.Basic');
          if VarIsNull(WB) then begin
            Application.MessageBox('Неудачный вызов объекта Word.Basic!' + #13#10 + 'Возможно, не установлен MS Word.', 'Предупреждение', MB_ICONWARNING + MB_OK);
            Exit;
          end;

          KW := '';
          // Прописка
          qryClient := TZReadOnlyQuery.Create(nil);
          qryClient.Connection := DM.DBConn;
          qryClient.Close;
          qryClient.SQL.Text := 'SELECT b.name AS city_name, CONCAT(c.name, '' '', d.short_name) AS street_name, e.number AS house_number, a.room_apartment';
          qryClient.SQL.Add('FROM residence_clients a');
          qryClient.SQL.Add('LEFT JOIN cities b ON b.city_id = a.city_id');
          qryClient.SQL.Add('LEFT JOIN streets c ON c.street_id = a.street_id');
          qryClient.SQL.Add('INNER JOIN street_types d ON d.street_type_id = c.street_type_id');
          qryClient.SQL.Add('LEFT JOIN houses e ON e.house_id = a.house_id');
          qryClient.SQL.Add(Format('WHERE (a.client_id = %d) AND (a.residence_type_id = %d)', [FCard.ClientID, 0]));
          qryClient.Open;
          //if (not qryClient.IsEmpty) then begin
          //  KW := qryClient.FieldByName('room_apartment').AsString;
          //end;

          WB.FileNew(W);
          WB.SetFormResult('IDDOC1',	WideString(edCardId.Text));
		      WB.SetFormResult('DOCDATE1', WideString(FormatDateTime('c', dtCreateDate.Date)));
          WB.SetFormResult('CLIENT1', WideString(Utf8ToAnsi(cbClients.Text)));
		      WB.SetFormResult('POD1',	  WideString(edPorch.Text));
		      WB.SetFormResult('GOROD2',	WideString(Utf8ToAnsi(cbCities.Text)));
		      WB.SetFormResult('STREET1',	WideString(Utf8ToAnsi(cbStreets.Text)));
		      WB.SetFormResult('HOUSE1',	WideString(Utf8ToAnsi(cbHouses.Text)));
		      WB.SetFormResult('GOROD1',	WideString(Utf8ToAnsi(cbCities.Text)));
		      WB.SetFormResult('STREET2',	WideString(Utf8ToAnsi(cbStreets.Text)));
		      WB.SetFormResult('HOUSE2',	WideString(Utf8ToAnsi(cbHouses.Text)));
		      WB.SetFormResult('POD2',		WideString(Utf8ToAnsi(edPorch.Text)));
		      WB.SetFormResult('OBORUD',	WideString(Utf8ToAnsi(cbEquipment.Text)));
		      WB.SetFormResult('DATE1',		WideString(FormatDateTime('c', dtCreditTo.Date)));
		      WB.SetFormResult('CLIENT2',	WideString(Utf8ToAnsi(cbClients.Text)));
		      WB.SetFormResult('PROPISKA',	WideString(Utf8ToAnsi(lbClientRegistration.Caption)));
		      WB.SetFormResult('FAKT',		WideString(Utf8ToAnsi(lbClientActualResidence.Caption)));
          V := DM.qryEquipments.Lookup('equipment_id', FCard.EquipmentID, 'guarantee_period');

          if not VarIsNull(V) then
            S := Format('%d', [Integer(V) * 12])
          else
            S := Format('%d', [1 * 12]);
          WB.SetFormResult('MES',		WideString(S));

		      WB.SetFormResult('PASPORT',	WideString(Utf8ToAnsi(lbClientIdentityCard.Caption)));
		      WB.SetFormResult('NUMER',		WideString(edNumeration.Text));
		      WB.SetFormResult('MPHONE', WideString(Utf8ToAnsi(edClientPhones.Text)));
          //ShowMessage(KW);
		      //WB.SetFormResult('KW',	WideString(Utf8ToAnsi(DM.qryRefResidenceClient2.FieldByName('room_apartment').AsString)));

          // Фактическое местожительство
          qryClient.Close;
          qryClient.SQL.Text := 'SELECT b.name AS city_name, CONCAT(c.name, '' '', d.short_name) AS street_name, e.number AS house_number, a.room_apartment';
          qryClient.SQL.Add('FROM residence_clients a');
          qryClient.SQL.Add('LEFT JOIN cities b ON b.city_id = a.city_id');
          qryClient.SQL.Add('LEFT JOIN streets c ON c.street_id = a.street_id');
          qryClient.SQL.Add('INNER JOIN street_types d ON d.street_type_id = c.street_type_id');
          qryClient.SQL.Add('LEFT JOIN houses e ON e.house_id = a.house_id');
          qryClient.SQL.Add(Format('WHERE (a.client_id = %d) AND (a.residence_type_id = %d)', [FCard.ClientID, 1]));
          qryClient.Open;

          if (not qryClient.IsEmpty) then begin
            KW := qryClient.FieldByName('room_apartment').AsString;
          end;

          qryClient.Free;

 		      WB.SetFormResult('KW',	WideString(Utf8ToAnsi(KW)));
          W := UTF8Decode(NameFile);
          WB.FileSaveAs(W);
		      WB.AppShow();
        end;
      except
        Application.MessageBox('Неудачная попытка открыть договор на установку!', 'Предупреждение', MB_ICONWARNING + MB_OK);
      end;
    finally
      if (not VarIsNull(WB)) then
        WB := Null;
    end;
    end;
  end;
end;
// ОТкрыть файл договора на обслуживание
procedure TfmNewCard.mnuContractServiceClick(Sender: TObject);
var
  NameFile: String;
  S, PathToTemplates, KW: string;
  //AProcess: TProcess;
  W: WideString;
  V, WB: Variant;
  qryClient: TZReadOnlyQuery;
begin
  WB := Null;

  NameFile := Format('%s-2.doc', [edCardId.Text]);
  if Trim(fMain.IntercomsSettings.PathToReportsFiles) <> '' then
    NameFile := fMain.IntercomsSettings.PathToReportsFiles + DirectorySeparator + NameFile;

  if FCurrentOperation = coOpenFile then begin
    if FileExists(NameFile) then  begin
      //AProcess := TProcess.Create(nil);
      //AProcess.CommandLine := Format('cmd /c "%s"', [NameFile]);
      //AProcess.Execute;
      //AProcess.Free;
      ShellExecute(Handle, 'open', PChar(Format('%s', [NameFile])), nil, nil, SW_SHOWNORMAL);
    end
    else
      Application.MessageBox(PChar(Format('Файл %s не существует!', [NameFile])), 'Предупреждение', MB_ICONWARNING + MB_OK);
  end
  else begin
    if Application.MessageBox('Вы действительно хотите сформировать договор?', 'Внимание', MB_ICONEXCLAMATION + MB_YESNO) = IDYES then begin
    try
      try
        PathToTemplates := ExtractFilePath(Application.Params[0]) + 'templates';
        V := DM.qryCities.Lookup('city_id', FCard.CityID, 'print_type');
        if not VarIsNull(V) then begin
          if Integer(V) = 2 then
            W := Utf8Decode(PathToTemplates + DirectorySeparator + 'contract_03.dotx')
          else
            W := Utf8Decode(PathToTemplates + DirectorySeparator + 'contract_00.dotx');

          WB := CreateOleObject('Word.Basic');
          if VarIsNull(WB) then begin
            Application.MessageBox('Неудачный вызов объекта Word.Basic!' + #13#10 + 'Возможно, не установлен MS Word.', 'Предупреждение', MB_ICONWARNING + MB_OK);
            Exit;
          end;

          KW := '';
          qryClient := TZReadOnlyQuery.Create(nil);
          qryClient.Connection := DM.DBConn;
          qryClient.Close;
          qryClient.SQL.Text := 'SELECT b.name AS city_name, CONCAT(c.name, '' '', d.short_name) AS street_name, e.number AS house_number, a.room_apartment';
          qryClient.SQL.Add('FROM residence_clients a');
          qryClient.SQL.Add('LEFT JOIN cities b ON b.city_id = a.city_id');
          qryClient.SQL.Add('LEFT JOIN streets c ON c.street_id = a.street_id');
          qryClient.SQL.Add('INNER JOIN street_types d ON d.street_type_id = c.street_type_id');
          qryClient.SQL.Add('LEFT JOIN houses e ON e.house_id = a.house_id');
          qryClient.SQL.Add(Format('WHERE (a.client_id = %d) AND (a.residence_type_id = %d)', [FCard.MClientID, 0]));
          qryClient.Open;
          if (not qryClient.IsEmpty) then begin
            KW := qryClient.FieldByName('room_apartment').AsString;
          end;
          qryClient.Free;

          WB.FileNew(W);
          WB.SetFormResult('GOROD1',	WideString(Utf8ToAnsi(cbCities.Text)));
          WB.SetFormResult('GOROD2',	WideString(Utf8ToAnsi(cbCities.Text)));
          WB.SetFormResult('GOROD3',	WideString(Utf8ToAnsi(cbCities.Text)));

          WB.SetFormResult('IDDOC1',	WideString(edCardId.Text));
		      WB.SetFormResult('DOCDATE1', WideString(FormatDateTime('c', dtCreateDate.Date)));
          WB.SetFormResult('CLIENT1', WideString(Utf8ToAnsi(cbMClients.Text)));
          WB.SetFormResult('OBORUD',	WideString(Utf8ToAnsi(cbEquipment.Text)));

          WB.SetFormResult('STREET1',	WideString(Utf8ToAnsi(cbStreets.Text)));
          WB.SetFormResult('STREET2',	WideString(Utf8ToAnsi(cbStreets.Text)));
          WB.SetFormResult('STREET3',	WideString(Utf8ToAnsi(cbStreets.Text)));

          WB.SetFormResult('HOUSE1',	WideString(Utf8ToAnsi(cbHouses.Text)));
          WB.SetFormResult('HOUSE2',	WideString(Utf8ToAnsi(cbHouses.Text)));
          WB.SetFormResult('HOUSE3',	WideString(Utf8ToAnsi(cbHouses.Text)));

          WB.SetFormResult('POD1',		WideString(Utf8ToAnsi(edPorch.Text)));
 		      WB.SetFormResult('POD2',		WideString(Utf8ToAnsi(edPorch.Text)));
          WB.SetFormResult('CLIENT2',	WideString(Utf8ToAnsi(cbMClients.Text)));
          WB.SetFormResult('PHONES', WideString(Utf8ToAnsi(edMClientPhones.Text)));
 		      WB.SetFormResult('UD',	WideString(Utf8ToAnsi(lbMClientIdentityCard.Caption)));
 		      //WB.SetFormResult('KW',	WideString(Utf8ToAnsi(Utf8ToAnsi(DM.qryRefResidenceClient2.FieldByName('room_apartment').AsString))));
 		      //WB.SetFormResult('KW',	WideString(Utf8ToAnsi(DM.qryRefResidenceClient2.FieldByName('room_apartment').AsString)));
 		      WB.SetFormResult('KW',	WideString(Utf8ToAnsi(KW)));

          W := UTF8Decode(NameFile);
          WB.FileSaveAs(W);
		      WB.AppShow();
        end;
      except
        Application.MessageBox('Неудачная попытка открыть договор на обслуживание!', 'Предупреждение', MB_ICONWARNING + MB_OK);
      end;
    finally
      if (not VarIsNull(WB)) then
        WB := Null;
    end;
    end;
  end;
end;

procedure TfmNewCard.sbnLoadCostPaymentsClick(Sender: TObject);
begin
  RefreshCostPayments(FCard.CityID);
end;

procedure TfmNewCard.sbnReceiptPrintingClick(Sender: TObject);
var
  BM: TBookmark;
  qryPrevPeriod: TZReadOnlyQuery;
  qryCalcPrevPayment: TZReadOnlyQuery;
  FormatSettings: TFormatSettings;
  //PrevStartService: TDateTime;
  //PrevEndService: TDateTime;
  I: Integer;
begin
  if FApartments.IsEmpty then begin
    Application.MessageBox('Нет информации по квартирам!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;
  if (Trim(edContractNumber.Text) = '') then begin
    Application.MessageBox('Не заполнен номер договора!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;

  grdApartments.DataSource.Dataset.DisableControls;

  // Узнать за прошлый год
  FormatSettings.ShortDateFormat := 'dd.mm.yyyy';
  FormatSettings.DateSeparator := '.';
  try
    FPrevStartService := StrToDate(dtStartService.Text, FormatSettings);
    FPrevStartService := DateUtils.IncYear(FPrevStartService, -1);
    FPrevStartStr := FormatDateTime('dd.mm.yyyy', FPrevStartService);
  finally
  end;

  qryPrevPeriod := TZReadOnlyQuery.Create(nil);
  qryPrevPeriod.Connection := DM.DBConn;
  qryPrevPeriod.Close;
  qryPrevPeriod.SQL.Text := Format('SELECT normal_payment, privilege_payment, receipt_printing FROM cards_history WHERE card_id = %d AND start_service = ''%s'' LIMIT 1', [FCard.CardID, FormatDateTime('yyyy-mm-dd', FPrevStartService)]);
  qryPrevPeriod.Open;

  if (not qryPrevPeriod.IsEmpty) then begin
     if (not qryPrevPeriod.FieldByName('receipt_printing').IsNull) then begin
        FPrevStartService := qryPrevPeriod.FieldByName('receipt_printing').AsDateTime;
     end;
     FPrevNormalPayment := qryPrevPeriod.FieldByName('normal_payment').AsCurrency;
     FPrevPrivilegePayment := qryPrevPeriod.FieldByName('privilege_payment').AsCurrency;
  end
  else begin
    FPrevStartService := IncYear(StrToDate(dtStartService.Text, FormatSettings), -1);
    FPrevNormalPayment := edNormalPayment.Value;
    FPrevPrivilegePayment := edPrivilegePayment.Value;
  end;

  FPrevEndService := StrToDate(dtStartService.Text, FormatSettings);
  if (dtReceiptPrinting.Text <> '') then begin
     FPrevEndService := StrToDate(dtReceiptPrinting.Text, FormatSettings);
  end;

  qryCalcPrevPayment := TZReadOnlyQuery.Create(nil);
  qryCalcPrevPayment.Connection := DM.DBConn;

  qryCalcPrevPayment.Close;
  qryCalcPrevPayment.SQL.Text := 'SELECT a.apartment_id, ';
  qryCalcPrevPayment.SQL.Add(Format('(SELECT SUM(amount) FROM payments WHERE apartment_id = a.apartment_id AND pay_date >= ''%s'' AND pay_date < ''%s'') AS prev_payment ', [FormatDateTime('yyyy-mm-dd', FPrevStartService), FormatDateTime('yyyy-mm-dd', FPrevEndService)]));
  qryCalcPrevPayment.SQL.Add('FROM apartments a');
  qryCalcPrevPayment.SQL.Add(Format('WHERE a.`card_id`= %d', [FCard.CardID]));
  qryCalcPrevPayment.SQL.Add('ORDER BY a.apartment_id');

  qryCalcPrevPayment.Open;

  //qryCalcPrevPayment.SQL.SaveToFile('d:\2.sql');

  if (not qryCalcPrevPayment.IsEmpty) then begin
     qryCalcPrevPayment.First;
     repeat
       //
       FApartments.First;
       for I := 0 to FApartments.RecordCount do begin
         if (FApartments.FieldByName('apartment_id').AsInteger = qryCalcPrevPayment.FieldByName('apartment_id').AsInteger) then begin
            FApartments.Edit;
            FApartments.FieldByName('prev_payment').AsCurrency := qryCalcPrevPayment.FieldByName('prev_payment').AsCurrency;
            FApartments.Post;
            break;
         end;
         fApartments.Next;
       end;
       //
       qryCalcPrevPayment.Next;
     until qryCalcPrevPayment.Eof;
  end;

  qryCalcPrevPayment.Close;
  if (qryCalcPrevPayment <> nil) then
     qryCalcPrevPayment.Free;

  qryPrevPeriod.Close;
  if (qryPrevPeriod <> nil) then
    qryPrevPeriod.Free;

  //grdApartments.DataSource.Dataset.DisableControls;
  //GetMem(BM, SizeOf(BM));
  BM := grdApartments.DataSource.Dataset.BookMark;

  DM.mFilterApartments.Open;
  DM.mFilterApartments.Filtered := False;
  DM.mFilterApartments.Clear(False);
  DM.mFilterApartments.CopyFromDataset(FApartments, True);
  DM.mFilterApartments.Filtered := True;

  if not DM.mFilterApartments.IsEmpty then
    DM.mFilterApartments.First;
  try
    frApartments.Dataset := frdsApartments;
    //if (FCard.CityID = 1) then begin
      frApartments.LoadFromFile('reports\receipts_pskov.lrf');
    //end
    //else begin
    //  frApartments.LoadFromFile('reports\receipts.lrf');
    //end;
    frApartments.Preview := nil;
    frApartments.ShowReport;
  finally
    grdApartments.DataSource.DataSet.Bookmark := BM;
    //grdApartments.DataSource.DataSet.FreeBookmark(BM);
    grdApartments.DataSource.Dataset.EnableControls;
    DM.mFilterApartments.Close;
  end;
end;

procedure TfmNewCard.sbnShowLogClick(Sender: TObject);
//type
//  TCompare = record
//    OutDate: TDateTime;
//    OutString: String;
//  end;
var
  fmLog: TfmLog;
  //Compare: TCompare;
  //FormatSettings: TFormatSettings;
begin

  //FormatSettings.ShortDateFormat := 'yyyy-mm-dd';
  //FormatSettings.DateSeparator := '-';
  //
  //if (FCard.ReceiptPrinting <> '') then begin
  //  Compare.OutDate := StrToDate(FCard.ReceiptPrinting, FormatSettings);
  //  Compare.OutString := DateTimeToStr(Compare.OutDate);
  //  ShowMessage(Compare.OutString);
  //end;
  //
  //Exit;

  DM.qryShowLog.Close;
  DM.qryShowLog.Params.ParamByName('p_card_id').AsInteger := FCard.CardID;
  DM.qryShowLog.Open;
  if (not DM.qryShowLog.IsEmpty) then begin
    fmLog := TfmLog.Create(Application);
    fmLog.ShowModal;
    fmLog.Free;
  end
  else begin
    Application.MessageBox(PChar('Нет данных по логу!'), 'Внимание', MB_ICONINFORMATION + MB_OK);
  end;
end;

procedure TfmNewCard.bnOKClick(Sender: TObject);
begin
  SaveData(TButton(Sender).Tag);
end;

procedure TfmNewCard.bnRefreshCitiesClick(Sender: TObject);
begin
  addCities;
end;

procedure TfmNewCard.bnRefreshHousesClick(Sender: TObject);
begin
  addHouses(FCard.StreetID);
end;

procedure TfmNewCard.bnRefreshStreetsClick(Sender: TObject);
begin
  addStreets(FCard.CityID);
end;

procedure TfmNewCard.bnContractsClick(Sender: TObject);
var
  pt, pt2: TPoint;
  V: Variant;
  PrintType: Integer;
begin
  case TButton(Sender).Tag of
    0: FCurrentOperation := coOpenFile;
    1: FCurrentOperation := coPrintFile;
  end;

  pmContracts.Items[1].Visible := True;
  pmContracts.Items[1].Enabled := True;
  if (FCard.CityID <> 0) then begin
    V := DM.qryCities.Lookup('city_id', FCard.CityID, 'print_type');
    if not VarIsNull(V) then begin
      pmContracts.Items[1].Visible := Integer(V) >= 1;
      pmContracts.Items[1].Enabled := pmContracts.Items[1].Visible;
    end;
  end;

  pt.x := TButton(Sender).Left;
  pt.y := pcCard.Height + TButton(Sender).Top + TButton(Sender).Height;

  pt2 := ClientToScreen(pt);
  pmContracts.PopUp(pt2.x, pt2.y);
end;

procedure TfmNewCard.bnEquipmentNotSelectedClick(Sender: TObject);
begin
  ClearEquipment;
end;

procedure TfmNewCard.bnHouseNotSelectedClick(Sender: TObject);
begin
  FCard.HouseID := 0;
  addHouseByDefault;
end;

procedure TfmNewCard.bnMountingNotSelectedClick(Sender: TObject);
begin
  ClearMounting;
end;

procedure TfmNewCard.actInsApartmentExecute(Sender: TObject);
var
  fmApartment: TfmApartment;
begin
  fmApartment := TfmApartment.Create(Application);
  fmApartment.Card := Self;
  fmApartment.FromApartment := StrToInt(edStartApartment.Text);
  fmApartment.ToApartment := StrToInt(edEndApartment.Text);
  fmApartment.IsNewRecord := TAction(Sender).Tag = 0;

  if (not fmApartment.IsNewRecord) then begin
    fmApartment.Caption := fmApartment.Caption + ' (редактирование)';
    fmApartment.edNumber.Text := FApartments.FieldByName('number').AsString;
    fmApartment.ComboBox1.ItemIndex := FApartments.FieldByName('letter').AsInteger;
  end
  else
    fmApartment.Caption := fmApartment.Caption + ' (новая)';

  if fmApartment.ShowModal = mrOK then begin
    if (fmApartment.IsNewRecord) then
      FApartments.Append
    else
      FApartments.Edit;
    FApartments.FieldByName('number').AsString := Trim(fmApartment.edNumber.Text);
    FApartments.FieldByName('letter').AsInteger:= fmApartment.ComboBox1.ItemIndex;
    FApartments.FieldByName('paid').AsInteger:= 0;
    FApartments.FieldByName('privilege').AsInteger:= 0;
    FApartments.FieldByName('exempt').AsInteger:= 0;
    //
    FApartments.FieldByName('calc_letter').AsString := EncodeApartmentLetter(fmApartment.ComboBox1.ItemIndex);
    FApartments.Post;
  end;
  Sort;
  fmApartment.Free;
  ShowDebtors;
end;

procedure TfmNewCard.actInsApartmentUpdate(Sender: TObject);
begin
  TAction(Sender).Enabled := FCard.CardID > 0;
end;

procedure TfmNewCard.actPaymentsHistoryExecute(Sender: TObject);
begin

  //DM.qryPaymentsHistory.Refresh;
  //DM.qryFinesHistory.Refresh;

  if not Assigned(frmPaymentsHistory) then
    frmPaymentsHistory := TfmPaymentsHistory.Create(Application);

  frmPaymentsHistory.ShowCountOfRecords;
  frmPaymentsHistory.PrintReceipts := fMain.IntercomsSettings.PrintReceipts;
  frmPaymentsHistory.Visible := False;
  frmPaymentsHistory.Show;
    if Screen.Width >= frmPaymentsHistory.Width + Self.Width + 32 then begin
    Self.Left := (Screen.Width - (Self.Width + frmPaymentsHistory.Width)) div 2 - 16;
    frmPaymentsHistory.Left := Self.Left + Self.Width + 16;
    frmPaymentsHistory.Top := Self.Top;
  end
  else begin
    frmPaymentsHistory.Top := 8;
    frmPaymentsHistory.Left := Screen.Width - frmPaymentsHistory.Width - 8;
  end;
  frmPaymentsHistory.Visible := True;
  frmPaymentsHistory.SetFocus;
end;

procedure TfmNewCard.bnAddCityClick(Sender: TObject);
var
  IsEdit: Boolean;
  NewID: Integer;
begin

  IsEdit := TButton(Sender).Tag = 1;

  if IsEdit then begin
    if (FCard.CityID = 0) then begin
      Application.MessageBox('Редактирование невозможно.' + Chr(13) + Chr(10) + 'Добавьте новый город!', 'Предупреждение', MB_ICONWARNING);
      Exit;
    end;
    DM.qryCities.Locate('city_id', FCard.CityID, [loPartialKey]);
    DM.qryCities.Edit;
  end
  else
    DM.qryCities.Insert;

  with TfmCity.Create(Application) do begin
    if ShowModal = mrOK then begin

      DM.qryCities.FieldByName('name').AsString := edName.Text;
      DM.qryCities.FieldByName('print_type').AsString := edPrintType.Text;
      DM.qryCities.FieldByName('normal_payment').AsString := edNormalPayment.Text;
      DM.qryCities.FieldByName('privilege_payment').AsString := edPrivilegePayment.Text;

      //DM.qryCities.FieldByName('normal_payment').AsString := ExtReplace(edNormalPayment.Text, ',', '.');
      //DM.qryCities.FieldByName('privilege_payment').AsString := ExtReplace(edPrivilegePayment.Text, ',', '.');

      DM.qryCities.Post;

      if not IsEdit then begin
        DM.qryLastCityID.Close;
        DM.qryLastCityID.Open;
        FCard.CityID := DM.qryLastCityID.FieldByName('last_city_id').AsInteger;
      end;
      DM.qryCities.Refresh;
      addCities;
      // Новый город
      if not IsEdit then begin
        FCard.StreetID := 0;
        FCard.HouseID := 0;
        addStreetByDefault;
        addHouseByDefault;
      end;
    end
    else begin
      DM.qryCities.Cancel;
    end;
    Free;
  end;

end;

procedure TfmNewCard.bnAddClientClick(Sender: TObject);
begin
  case TBitBtn(Sender).Tag of
    0: ChangeClientEx(False, -1, TBitBtn(Sender).Tag);
    1:
      begin
        if (FCard.ClientID > 0) then
          ChangeClientEx(True, FCard.ClientID, TBitBtn(Sender).Tag)
        else begin
          Application.MessageBox('Редактирование невозможно.' + Chr(13) + Chr(10) + 'Добавьте нового клиента!', 'Предупреждение', MB_ICONWARNING);
          Exit;
        end;
      end;
    2: ChangeClientEx(False, -1, TBitBtn(Sender).Tag);
    3:
      begin
        if (FCard.MClientID > 0) then
          ChangeClientEx(True, FCard.MClientID, TBitBtn(Sender).Tag)
        else begin
          Application.MessageBox('Редактирование невозможно.' + Chr(13) + Chr(10) + 'Добавьте нового клиента!', 'Предупреждение', MB_ICONWARNING);
          Exit;
        end;
      end;
    4:
      begin
        addClients(FCard.ClientID);
      end;
    5:
      begin
        addClients(FCard.MClientID);
      end;
  end;
  //chOnePerson.Checked := Integer(cbClients.Items.Objects[cbClients.ItemIndex]) = Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);
  chOnePerson.Checked := FCard.ClientID = FCard.MClientID;
end;

procedure TfmNewCard.bnAddHouseClick(Sender: TObject);
var
  IsEdit: Boolean;
begin

  IsEdit := TButton(Sender).Tag = 1;

  DM.qryRefHouses.Close;
  DM.qryRefHouses.Params.ParamByName('street_id').AsInteger := FCard.StreetID;
  DM.qryRefHouses.Open;

  if IsEdit then begin
    if (FCard.HouseID = 0) then begin
      Application.MessageBox('Редактирование невозможно.' + Chr(13) + Chr(10) + 'Добавьте новый дом!', 'Предупреждение', MB_ICONWARNING);
      Exit;
    end;
    DM.qryRefHouses.Locate('house_id', FCard.HouseID, [loPartialKey]);
    DM.qryRefHouses.Edit;
  end
  else
    DM.qryRefHouses.Insert;
  with TfmHouse.Create(Application) do begin
    if ShowModal = mrOK then begin
      DM.qryRefHouses.FieldByName('street_id').AsInteger := FCard.StreetID;
      DM.qryRefHouses.Post;
      if not IsEdit then begin
        DM.qryLastHouseID.Close;
        DM.qryLastHouseID.Open;
        FCard.HouseID := DM.qryLastHouseID.FieldByName('last_house_id').AsInteger;
      end;
      DM.qryRefHouses.Refresh;
      addHouses(FCard.StreetID);
      //if not IsEdit then
      //  lcbHouses.KeyValue := NewID
      //else
      //  lcbHouses.KeyValue := ID;
      //DM.qryCards.FieldByName('house_id').AsInteger := lcbHouses.KeyValue;
    end
    else begin
      DM.qryRefHouses.Cancel;
    end;
    Free;
  end;
end;

procedure TfmNewCard.bnAddStreetClick(Sender: TObject);
var
  IsEdit: Boolean;
  NewID: Integer;
begin

  IsEdit := TButton(Sender).Tag = 1;

  DM.qryRefStreets.Close;
  DM.qryRefStreets.Params.ParamByName('city_id').AsInteger := FCard.CityID;
  DM.qryRefStreets.Open;

  if IsEdit then begin
    if (FCard.StreetID = 0) then begin
      Application.MessageBox('Редактирование невозможно.' + Chr(13) + Chr(10) + 'Добавьте новую улицу!', 'Предупреждение', MB_ICONWARNING);
      Exit;
    end;
    DM.qryRefStreets.Locate('street_id', FCard.StreetID, [loPartialKey]);
    DM.qryRefStreets.Edit;
  end
  else
    DM.qryRefStreets.Insert;

  with TfmStreet.Create(Application) do begin
    if ShowModal = mrOK then begin
      DM.qryRefStreets.FieldByName('city_id').AsInteger := FCard.CityID;
      DM.qryRefStreets.Post;
      if not IsEdit then begin
        DM.qryLastStreetID.Close;
        DM.qryLastStreetID.Open;
        FCard.StreetID := DM.qryLastStreetID.FieldByName('last_street_id').AsInteger;
      end;
      DM.qryRefStreets.Refresh;
      addStreets(FCard.CityID);
      if not IsEdit then begin
        FCard.HouseID := 0;
        addHouseByDefault;
      end;
    end
    else begin
      DM.qryRefStreets.Cancel;
    end;
    Free;
  end;
end;

procedure TfmNewCard.bnBrigadeNotSelectedClick(Sender: TObject);
begin
  ClearBrigade;
end;

procedure TfmNewCard.bnCityNotSelectedClick(Sender: TObject);
begin
  FCard.CityID := 0;
  FCard.StreetID := 0;
  FCard.HouseID := 0;
  //
  ClearCity;
  addStreetByDefault;
  addHouseByDefault;
end;

procedure TfmNewCard.actDelApartmentExecute(Sender: TObject);
begin
  if Application.MessageBox('Вы действительно хотите удалить квартиру?', 'Предупреждение', MB_ICONWARNING + MB_YESNO) = IDYES then begin
    if FApartments.FieldByName('apartment_id').AsInteger > 0 then begin
      //ShowMessage(FApartments.FieldByName('apartment_id').AsString);
      //Exit;
      //if Assigned(DM.qryPaymentsHistory) and (not DM.qryPaymentsHistory.IsEmpty) then begin
      //  Application.MessageBox(PChar(Format('Вы не можете удалить квартиру № %d.' + Chr(13) + Chr(10) + 'По этой квартире осуществлены платежи.' + Chr(10) + Chr(13) + 'Смотрите историю платежей!', [FApartments.FieldByName('number').AsInteger])), 'Информация', MB_ICONINFORMATION);
      //  Exit;
      //end;
      FDeleteApartments.Append;
      FDeleteApartments.FieldByName('apartment_id').AsInteger := FApartments.FieldByName('apartment_id').AsInteger;
      FDeleteApartments.Post;
    end;
    FApartments.Delete;
    ShowDebtors;
  end;
end;

procedure TfmNewCard.actBuildListUpdate(Sender: TObject);
begin
  TAction(Sender).Enabled := FCard.CardID > 0;
end;

procedure TfmNewCard.actClearListExecute(Sender: TObject);
begin
  if Application.MessageBox('Вы действительно хотите очистить список квартир?', 'Предупреждение', MB_ICONWARNING + MB_YESNO)= ID_YES then begin
      grdApartments.BeginUpdate;
      FApartments.First;
      repeat
        FDeleteApartments.Append;
        FDeleteApartments.FieldByName('apartment_id').AsInteger  := FApartments.FieldByName('apartment_id').AsInteger;
        //DeleteApartments.FieldByName('paid').AsInteger          := DM.mApartments.FieldByName('paid').AsInteger;
        //DeleteApartments.FieldByName('number').AsInteger        := DM.mApartments.FieldByName('number').AsInteger;
        //DeleteApartments.FieldByName('card_id').AsInteger       := DM.mApartments.FieldByName('card_id').AsInteger;
        //DeleteApartments.FieldByName('privilege').AsInteger     := DM.mApartments.FieldByName('privilege').AsInteger;
        //DeleteApartments.FieldByName('exempt').AsInteger        := DM.mApartments.FieldByName('exempt').AsInteger;
        //DeleteApartments.FieldByName('letter').AsInteger        := DM.mApartments.FieldByName('letter').AsInteger;
        //DeleteApartments.FieldByName('calc_letter').AsString    := DM.mApartments.FieldByName('calc_letter').AsString;
        FDeleteApartments.Post;
        FApartments.Next;
      until FApartments.Eof;
      FApartments.Clear(False);
      grdApartments.EndUpdate();
      ShowDebtors;
    end;
end;

procedure TfmNewCard.actClearListUpdate(Sender: TObject);
begin
  TAction(Sender).Enabled := (FApartments.RecordCount > 0) and (FCard.CardID > 0);
end;

procedure TfmNewCard.actClearPaymentsExecute(Sender: TObject);
begin
  if Application.MessageBox('Вы дейстительно хотите очистить колонку "Оплачено" по всем абонентам?', 'Внимание', MB_ICONEXCLAMATION + MB_YESNO + MB_DEFBUTTON2) = IDYES then begin
    ClearPayments;
    ShowDebtors;
  end;
end;

procedure TfmNewCard.actCopyTextExecute(Sender: TObject);
begin
  Clipboard.AsText := memoShowDebtors.SelText;
end;

procedure TfmNewCard.actCopyTextUpdate(Sender: TObject);
var
  S: String;
begin
  S := memoShowDebtors.SelText;
  TAction(Sender).Enabled := Length(S) > 0;
end;

procedure TfmNewCard .actCreateFineExecute (Sender : TObject );
var
  fmShortFine: TfmShortFine;
  qryAddFine: TZQuery;
  CreateDateTime, AmountOfFine: string;
  Remark: WideString;
  V: Variant;

  qryCostConnection: TZReadOnlyQuery;
begin
  fmShortFine := TfmShortFine.Create(Application);
  fmShortFine.deCreateFine.Text := FormatDateTime('dd.mm.yyyy', Now());
  fmShortFine.bnPrintReceipt.Caption := 'Печать';
  fmShortFine.bnPrintReceipt.ModalResult := mrNone;

  fmShortFine.bnOK.Caption := 'Записать';
  fmShortFine.bnOK.ModalResult := mrNone;

  fmShortFine.bnSaveAndClose.Caption := 'Записать и закрыть';
  fmShortFine.bnSaveAndClose.ModalResult := mrOK;

  fmShortFine.ApartmentId := FApartments.FieldByName('apartment_id').AsInteger;
  fmShortFine.edApartment.Text := FApartments.FieldByName('number').AsString + EncodeApartmentLetter(FApartments.FieldByName('letter').AsInteger);

  qryCostConnection := TZReadOnlyQuery.Create(nil);
  qryCostConnection.Connection := DM.DBConn;

  try
    qryCostConnection.Close;
    qryCostConnection.SQL.Text := Format('SELECT cost_of_connection FROM cities WHERE city_id = %d', [FCard.CityID]);
    qryCostConnection.Open;

    if (not qryCostConnection.IsEmpty) then begin
      fmShortFine.meAmountOfFine.Value := qryCostConnection.FieldByName('cost_of_connection').AsFloat;
    end;

  finally
    qryCostConnection.Free;
  end;

  if fmShortFine.ShowModal = mrOK then begin

    //try
    //  CreateDateTime := FormatDateTime('yyyy-mm-dd', fmShortFine.deCreateFine.Date);
    //  AmountOfFine := uUtils.ExtReplace(fmShortFine.meAmountOfFine.Text, ',', '.');
    //  Remark := StringReplace(fmShortFine.memoRemark.Lines.Text, '\', '', [rfReplaceAll, rfIgnoreCase]);
    //
    //  qryAddFine := TZQuery.Create(nil);
    //  qryAddFine.Connection := DM.DBConn;
    //  qryAddFine.SQL.Text := Format('INSERT INTO fines (create_dt, apartment_id, amount_of_fine, remark, paid) values (''%s'', %d, ''%s'', ''%s'', %d)',
    //    [
    //      CreateDateTime,
    //      FApartments.FieldByName('apartment_id').AsInteger,
    //      AmountOfFine,
    //      Remark,
    //      Integer(fmShortFine.chPaid.Checked)
    //    ]);
    //  qryAddFine.ExecSQL;
    //
    //
    //finally
    //  qryAddFine.Free;
    //  qryAddFine := nil;
    //end;

  end;

  if (fmShortFine.LastFineId > 0) then begin
    ShowHistory;
  end;

  fmShortFine.Free;
end;

procedure TfmNewCard.actBuildListExecute(Sender: TObject);
var
  I, StartApartment, EndApartment: Integer;
begin
  if (Trim(edStartApartment.Text) <> '') and (Trim(edEndApartment.Text) <> '') then begin
    if (TryStrToInt(edStartApartment.Text, StartApartment)) and (TryStrToInt(edEndApartment.Text, EndApartment)) then begin
      if StartApartment > EndApartment then begin
        Application.MessageBox('Начальный номер квартиры больше конечного номера квартиры!', 'Предупреждение', MB_ICONWARNING);
        Exit;
      end;
      if (StartApartment = 0) or (EndApartment = 0) then begin
        Application.MessageBox('Номера квартир не могут начинаться с 0!', 'Предупреждение', MB_ICONWARNING);
        Exit;
      end;
    end;
  end
  else begin
    Application.MessageBox('Начальные и конечные номера квартир не являются числами!', 'Предупреждение', MB_ICONWARNING);
    Exit;
  end;
  if not FApartments.IsEmpty then begin
    if Application.MessageBox('Существующие данные будут перезаписаны!' + #13#10 + 'Продолжить построение списка?', 'Внимание', MB_ICONASTERISK + MB_YESNO) = IDYES then begin
      grdApartments.BeginUpdate;
      FApartments.Clear(False);
      grdApartments.EndUpdate();
    end
    else
      Exit;
  end;
  grdApartments.BeginUpdate;
  if not FApartments.Active then
    FApartments.Open;
  for I := StartApartment to EndApartment do begin
      FApartments.Append;
      FApartments.FieldByName('paid').AsInteger := 0;
      FApartments.FieldByName('number').AsInteger := I;
      FApartments.FieldByName('apartment_id').AsInteger := 0;
      FApartments.FieldByName('privilege').AsInteger :=0;
      FApartments.FieldByName('exempt').AsInteger := 0;
      FApartments.FieldByName('letter').AsInteger := 0;
      FApartments.Post;
  end;
  FApartments.First;
  //grdApartments.DataSource.DataSet := FApartments;
  grdApartments.EndUpdate();
  ShowDebtors;
end;

procedure TfmNewCard.actDelApartmentUpdate(Sender: TObject);
begin
  //TAction(Sender).Enabled := (fMain.FApartments.RecordCount > 0) and (FCard.CardID > 0);
end;

procedure TfmNewCard.actIncrYearExecute(Sender: TObject);
var
  FormatSettings: TFormatSettings;
  ExistingDate: TDateTime;
  I: Integer;
begin
  FormatSettings.ShortDateFormat := 'dd.mm.yyyy';
  FormatSettings.DateSeparator := '.';
  if (dtStartService.Text <> '') then begin
    try
      ExistingDate := StrToDate(dtStartService.Text, FormatSettings);
      ExistingDate := DateUtils.IncYear(ExistingDate);
      dtStartService.Text := FormatDateTime('dd.mm.yyyy', ExistingDate);
      dtProlongation.Text := dtEndService.Text;

      dtReceiptPrinting.Date := Now();
      FApartments.First;
      for I := 0 to FApartments.RecordCount do begin
          FApartments.Edit;
          FApartments.FieldByName('paid').AsInteger := 0;
          FApartments.FieldByName('half_paid').AsInteger := 0;
          FApartments.Post;
          fApartments.Next;
      end;
      FApartments.First;

    except
      //
    end;
  end;
end;

// Загрузка справочников
procedure TfmNewCard.LoadRefs;
var
  qryRefs: TZReadOnlyQuery;
  CurrentPosition: Integer;
  Letter: Integer;
begin
  try
    qryRefs := TZReadOnlyQuery.Create(nil);
    qryRefs.Connection := DM.DBConn;

    // Оборудование
    CurrentPosition := -1;
    qryRefs.Close;
    qryRefs.SQL.Text := 'SELECT equipment_id, name FROM equipments ORDER BY name';
    qryRefs.Open;
    if (not qryRefs.IsEmpty) then begin
      cbEquipment.Items.BeginUpdate;
      repeat
        cbEquipment.Items.AddObject(qryRefs.FieldByName('name').AsString, TObject(qryRefs.FieldByName('equipment_id').AsInteger));
        if (qryRefs.FieldByName('equipment_id').AsInteger = FCard.EquipmentID) then begin
          //FCard.OldEquipmentName := qryRefs.FieldByName('name').AsString;
          CurrentPosition := cbEquipment.Items.Count - 1;
        end;
        qryRefs.Next;
      until qryRefs.EOF;
      cbEquipment.Items.EndUpdate;
      if (CurrentPosition <> -1) then
        cbEquipment.ItemIndex := CurrentPosition;
    end;

    // Гoрод
    addCities;

    // Улицы
    if (FCard.CityID = 0) then begin
      addStreetByDefault;
    end
    else begin
      addStreets(FCard.CityID);

    end;

    // Дома
    if (FCard.StreetID = 0) then begin
      addHouseByDefault;
    end
    else begin
      addHouses(FCard.StreetID);
    end;
    addClients(FCard.ClientID);
    addMClients(FCard.MClientID);

    // Бригады
    CurrentPosition := -1;
    qryRefs.Close;
    qryRefs.SQL.Text := 'SELECT brigade_id, name FROM brigades ORDER BY name';
    qryRefs.Open;
    if (not qryRefs.IsEmpty) then begin
      cbBrigade.Items.BeginUpdate;
      repeat
        cbBrigade.Items.AddObject(qryRefs.FieldByName('name').AsString, TObject(qryRefs.FieldByName('brigade_id').AsInteger));
        if (qryRefs.FieldByName('brigade_id').AsInteger = FCard.BrigadeID) then begin
          //FCard.OldBrigadeName := qryRefs.FieldByName('name').AsString;
          CurrentPosition := cbBrigade.Items.Count - 1;
        end;
        qryRefs.Next;
      until qryRefs.EOF;
      cbBrigade.Items.EndUpdate;
      if (CurrentPosition <> -1) then
        cbBrigade.ItemIndex := CurrentPosition;

      CurrentPosition := -1;
      qryRefs.First;
      cbMounting.Items.BeginUpdate;
      repeat
        cbMounting.Items.AddObject(qryRefs.FieldByName('name').AsString, TObject(qryRefs.FieldByName('brigade_id').AsInteger));
        if (qryRefs.FieldByName('brigade_id').AsInteger = FCard.Mounting) then begin
          //FCard.OldMountingName := qryRefs.FieldByName('name').AsString;
          CurrentPosition := cbMounting.Items.Count - 1;
        end;
        qryRefs.Next;
      until qryRefs.EOF;
      cbMounting.Items.EndUpdate;
      if (CurrentPosition <> -1) then
        cbMounting.ItemIndex := CurrentPosition;
    end;

    CurrentPosition := -1;
    qryRefs.Close;
    qryRefs.SQL.Text := 'SELECT state_contract_id, name FROM state_contract ORDER BY state_contract_id';
    qryRefs.Open;
    if (not qryRefs.IsEmpty) then begin
      cbMaintenanceContract.Items.BeginUpdate;
      repeat
        cbMaintenanceContract.Items.AddObject(qryRefs.FieldByName('name').AsString, TObject(qryRefs.FieldByName('state_contract_id').AsInteger));
        if (qryRefs.FieldByName('state_contract_id').AsInteger = FCard.MaintenanceContract) then begin
          //Fcard.OldMaintenanceContractName := qryRefs.FieldByName('name').AsString;
          CurrentPosition := cbMaintenanceContract.Items.Count - 1;
        end;
        qryRefs.Next;
      until qryRefs.EOF;
      cbMaintenanceContract.Items.EndUpdate;
      if (CurrentPosition <> -1) then
        cbMaintenanceContract.ItemIndex := CurrentPosition;
    end;

    CurrentPosition := -1;
    qryRefs.Close;
    qryRefs.SQL.Text := 'SELECT payment_type_id, name FROM payment_types ORDER BY payment_type_id';
    qryRefs.Open;
    if (not qryRefs.IsEmpty) then begin
      cbPaymentTypes.Items.BeginUpdate;
      repeat
        cbPaymentTypes.Items.AddObject(qryRefs.FieldByName('name').AsString, TObject(qryRefs.FieldByName('payment_type_id').AsInteger));
        if (qryRefs.FieldByName('payment_type_id').AsInteger = FCard.MPaymentTypeID) then begin
          //FCard.OldMPaymentTypeName := qryRefs.FieldByName('name').AsString;
          CurrentPosition := cbPaymentTypes.Items.Count - 1;
        end;
        qryRefs.Next;
      until qryRefs.EOF;
      cbPaymentTypes.Items.EndUpdate;
      if (CurrentPosition <> -1) then
        cbPaymentTypes.ItemIndex := CurrentPosition;
    end;

    // проверить оплаты по квартирам
    // 30 Nov 2016
    //CheckPayments(FCard.CardID);

    // Квартиры
    FApartments := TMemDataset.Create(nil);
    FApartments.FieldDefs.Add('apartment_id', ftInteger, 0);
    FApartments.FieldDefs.Add('paid', ftInteger);
    FApartments.FieldDefs.Add('number', ftInteger);
    FApartments.FieldDefs.Add('card_id', ftInteger);
    FApartments.FieldDefs.Add('privilege', ftSmallint);
    FApartments.FieldDefs.Add('exempt', ftSmallint);
    FApartments.FieldDefs.Add('letter', ftSmallint);
    FApartments.FieldDefs.Add('half_paid', ftInteger);
    FApartments.FieldDefs.Add('locked', ftInteger);
    FApartments.FieldDefs.Add('calc_letter', ftString, 10);
    FApartments.FieldDefs.Add('paid_dt', ftString, 40);
    FApartments.FieldDefs.Add('prev_payment', ftCurrency);
    FApartments.Open;

    grdApartments.BeginUpdate;
    grdApartments.DataSource.DataSet := FApartments;
    //grdApartments.DataSource.DataSet.Assign(FApartments);

    if (FCard.CardID > 0) then begin
      DM.qryRefApartments.Close;
      DM.qryRefApartments.Params.ParamByName('card_id').AsInteger := FCard.CardID;
      DM.qryRefApartments.Open;

      if not DM.qryRefApartments.IsEmpty then begin
        repeat
          FApartments.Append;
          Letter := DM.qryRefApartments.Fields[6].AsInteger;
          FApartments.Fields[0].AsInteger  := DM.qryRefApartments.Fields[0].AsInteger;
          FApartments.Fields[1].AsInteger  := DM.qryRefApartments.Fields[1].AsInteger;
          FApartments.Fields[2].AsInteger  := DM.qryRefApartments.Fields[2].AsInteger;
          FApartments.Fields[3].AsInteger  := DM.qryRefApartments.Fields[3].AsInteger;
          FApartments.Fields[4].AsInteger  := DM.qryRefApartments.Fields[4].AsInteger;
          FApartments.Fields[5].AsInteger  := DM.qryRefApartments.Fields[5].AsInteger;
          FApartments.Fields[6].AsInteger  := Letter;
          FApartments.Fields[7].AsInteger  := DM.qryRefApartments.Fields[7].AsInteger;
          FApartments.Fields[8].AsInteger  := DM.qryRefApartments.Fields[8].AsInteger;

          if (Letter) > 0 then
            FApartments.Fields[9].AsString := EncodeApartmentLetter(Letter);

          if (not DM.qryRefApartments.Fields[9].IsNull) then begin
            // paid = 1
            if (FApartments.Fields[1].AsInteger = 1) then begin
              FApartments.Fields[10].AsString := DM.qryRefApartments.Fields[9].AsString;
            end;
          end;

          FApartments.Post;

          DM.qryRefApartments.Next;
        until DM.qryRefApartments.EOF;
        FApartments.First;
      end;

    end;

    FOldApartments := TMemDataset.Create(nil);
    FOldApartments.CopyFromDataset(FApartments, True);
    FOldApartments.Open;

    FApartments.First;
    FOldApartments.First;

    grdApartments.EndUpdate;

    //ShowDebtors;
  finally
    qryRefs.Free;
  end;
end;

procedure TfmNewCard.addCities;
var
  CurrentPosition: Integer;
begin
  CurrentPosition := -1;
  if (Assigned(FQryCities)) then begin
    FQryCities.Free;
    FQryCities := nil;
  end;
  FQryCities := TZQuery.Create(nil);
  FQryCities.Connection := DM.DBConn;
  FQryCities.Close;
  FQryCities.SQL.Text := 'SELECT a.city_id, a.name, a.print_type, a.normal_payment, a.privilege_payment, a.phone, a.cost_of_connection, a.link, a.office_address';
  FQryCities.SQL.Add('FROM cities a');
  FQryCities.SQL.Add('WHERE a.code <> 67');
  FQryCities.SQL.Add('ORDER BY a.code desc, a.name');
  FQryCities.Open;

  if (not FQryCities.IsEmpty) then begin
    cbCities.Items.BeginUpdate;
    repeat
      cbCities.Items.AddObject(FQryCities.FieldByName('name').AsString, TObject(FQryCities.FieldByName('city_id').AsInteger));
      if (FQryCities.FieldByName('city_id').AsInteger = FCard.CityID) then begin
        //FCard.OldCityName := FQryCities.FieldByName('name').AsString;
        CurrentPosition := cbCities.Items.Count - 1;
        FCityPhone := FQryCities.FieldByName('phone').AsString;
        FLink := FQryCities.FieldByName('link').AsString;
        FOfficeAddress := FQryCities.FieldByName('office_address').AsString;
        FCostOfConnection := FQryCities.FieldByName('cost_of_connection').AsCurrency;
      end;
      FQryCities.Next;
    until FQryCities.EOF;
    cbCities.Items.EndUpdate;
    if (CurrentPosition <> -1) then
      cbCities.ItemIndex := CurrentPosition;
  end;
end;

// Улица по умолчанию
procedure TfmNewCard.addStreetByDefault;
begin
  cbStreets.Items.BeginUpdate;
  cbStreets.Items.Clear;
  cbStreets.Items.AddObject(cNoData, TObject(0));
  cbStreets.ItemIndex := 0;
  cbStreets.Items.EndUpdate;
  //FCard.OldStreetName := cNoData;
end;

// Залить улицы для выбранного горола
procedure TfmNewCard.addStreets(CityID: Integer);
var
  qryStreets: TZReadOnlyQuery;
  CurrentPosition: Integer;
begin
  if (CityID > 0) then begin
    CurrentPosition := -1;
    cbStreets.Items.BeginUpdate;

    cbStreets.Items.Clear;
    try
      qryStreets := TZReadOnlyQuery.Create(nil);
      qryStreets.Connection := DM.DBConn;
      qryStreets.Close;
      //qryStreets.SQL.Text := 'SELECT a.street_id, CONCAT(a.name, '' '', b.short_name) AS street_name';
      qryStreets.SQL.Text := 'SELECT a.street_id, a.name AS street_name';
      qryStreets.SQL.Add('FROM streets a');
      qryStreets.SQL.Add('LEFT JOIN street_types b ON a.street_type_id = b.street_type_id');
      qryStreets.SQL.Add(Format('WHERE (a.city_id = %d)', [CityID]));
      qryStreets.SQL.Add('OR (a.city_id = 0)');
      qryStreets.SQL.Add('ORDER BY street_name ASC');
      qryStreets.Open;
      if (not qryStreets.IsEmpty) then begin
        repeat
          cbStreets.Items.AddObject(qryStreets.FieldByName('street_name').AsString, TObject(qryStreets.FieldByName('street_id').AsInteger));
          if (qryStreets.FieldByName('street_id').AsInteger = FCard.StreetID) then begin
            //FCard.OldStreetName := qryStreets.FieldByName('street_name').AsString;
            CurrentPosition := cbStreets.Items.Count - 1;
          end;
          qryStreets.Next;
        until qryStreets.EOF;
        if (CurrentPosition <> -1) then
          cbStreets.ItemIndex := CurrentPosition;
      end;
    finally
      qryStreets.Free;
    end;

    cbStreets.Items.EndUpdate;
  end;
end;

procedure TfmNewCard.addHouseByDefault;
begin
  cbHouses.Items.BeginUpdate;
  cbHouses.Items.Clear;
  cbHouses.Items.AddObject('', TObject(0));
  cbHouses.ItemIndex := 0;
  cbHouses.Items.EndUpdate;
  //FCard.OldHouseNumber := '';
end;

procedure TfmNewCard.addHouses(StreetID: Integer);
var
  qryHouses: TZReadOnlyQuery;
  CurrentPosition: Integer;
begin
  if (StreetID > 0) then begin
    CurrentPosition := -1;
    cbHouses.Items.BeginUpdate;

    cbHouses.Items.Clear;
    try
      qryHouses := TZReadOnlyQuery.Create(nil);
      qryHouses.Connection := DM.DBConn;
      qryHouses.Close;
      qryHouses.SQL.Text := 'SELECT a.house_id, a.number';
      qryHouses.SQL.Add('FROM houses a');
      qryHouses.SQL.Add(Format('WHERE (a.street_id = %d)', [StreetID]));
      qryHouses.SQL.Add('OR (a.street_id = 0)');
      qryHouses.SQL.Add('ORDER BY a.number ASC');
      qryHouses.Open;
      if (not qryHouses.IsEmpty) then begin
        repeat
          cbHouses.Items.AddObject(qryHouses.FieldByName('number').AsString, TObject(qryHouses.FieldByName('house_id').AsInteger));
          if (qryHouses.FieldByName('house_id').AsInteger = FCard.HouseID) then begin
            //FCard.OldHouseNumber := qryHouses.FieldByName('number').AsString;
            CurrentPosition := cbHouses.Items.Count - 1;
          end;
          qryHouses.Next;
        until qryHouses.EOF;
        if (CurrentPosition <> -1) then
          cbHouses.ItemIndex := CurrentPosition;
      end;
    finally
      qryHouses.Free;
    end;

    cbHouses.Items.EndUpdate;
  end;
end;

procedure TfmNewCard.addClients(ClientID: Integer);
var
  qryClients: TZReadOnlyQuery;
  CurrentPosition: Integer;
begin
  CurrentPosition := -1;
  cbClients.Items.BeginUpdate;

  cbClients.Items.Clear;
  try
    qryClients := TZReadOnlyQuery.Create(nil);
    qryClients.Connection := DM.DBConn;
    qryClients.Close;
    qryClients.SQL.Text := 'SELECT a.client_id, a.name';
    qryClients.SQL.Add('FROM clients a');
    qryClients.SQL.Add('ORDER BY a.name ASC');
    qryClients.Open;
    if (not qryClients.IsEmpty) then begin
      repeat
        cbClients.Items.AddObject(qryClients.FieldByName('name').AsString, TObject(qryClients.FieldByName('client_id').AsInteger));
        if (qryClients.FieldByName('client_id').AsInteger = ClientID) then begin
          CurrentPosition := cbClients.Items.Count - 1;
        end;
        qryClients.Next;
      until qryClients.EOF;
      if (CurrentPosition <> -1) then
        cbClients.ItemIndex := CurrentPosition;
    end;
  finally
    qryClients.Free;
  end;

  cbClients.Items.EndUpdate;
end;

procedure TfmNewCard.addMClients(ClientID: Integer);
var
  qryClients: TZReadOnlyQuery;
  CurrentPosition: Integer;
begin
  CurrentPosition := -1;
  cbMClients.Items.BeginUpdate;

  cbMClients.Items.Clear;
  try
    qryClients := TZReadOnlyQuery.Create(nil);
    qryClients.Connection := DM.DBConn;
    qryClients.Close;
    qryClients.SQL.Text := 'SELECT a.client_id, a.name';
    qryClients.SQL.Add('FROM clients a');
    qryClients.SQL.Add('ORDER BY a.name ASC');
    qryClients.Open;
    if (not qryClients.IsEmpty) then begin
      repeat
        cbMClients.Items.AddObject(qryClients.FieldByName('name').AsString, TObject(qryClients.FieldByName('client_id').AsInteger));
        if (qryClients.FieldByName('client_id').AsInteger = ClientID) then begin
          CurrentPosition := cbMClients.Items.Count - 1;
        end;
        qryClients.Next;
      until qryClients.EOF;
      if (CurrentPosition <> -1) then
        cbMClients.ItemIndex := CurrentPosition;
    end;
  finally
    qryClients.Free;
  end;

  cbMClients.Items.EndUpdate;
end;

procedure TfmNewCard.SaveHistory;
type
  TCompare = record
    OutDate: TDateTime;
    OutString: String;
  end;

var
  I: Integer;
  LogList: TStringList;
  BM: TBookmark;
  Compare: TCompare;
  FormatSettings: TFormatSettings;

  procedure CompareDates(const Annotation, ADate1, ADate2: String);
  begin
    if (Assigned(LogList)) then begin
      if (ADate1 <> '') then begin
        Compare.OutDate := StrToDate(ADate1, FormatSettings);
        Compare.OutString := FormatDateTime('dd.mm.yyyy', Compare.OutDate);
        if (Compare.OutString <> ADate2) then begin
          LogList.Add('Поле "Дата печати квитанций"');
          LogList.Add(Format('Старое значение: %s', [Compare.OutString]));
          LogList.Add(Format('Новое значение : %s', [ADate2]));
          LogList.Add('<------->');
        end
      end
      else begin
        if (ADate1 <> ADate2) then begin
          LogList.Add('Поле "Дата печати квитанций"');
          LogList.Add(Format('Старое значение: %s', [ADate1]));
          LogList.Add(Format('Новое значение : %s', [ADate2]));
          LogList.Add('<------->');
        end;
      end;
    end;
  end;


begin

  FormatSettings.ShortDateFormat := 'yyyy-mm-dd';
  FormatSettings.DateSeparator := '-';

  try
    LogList := TStringList.Create;
    // Закладка "Основное"
    CompareDates('Поле "Дата заполнения"', FCard.CreateDate, dtCreateDate.Text);
    //if (FCard.CreateDate <> dtCreateDate.Text) then begin
    //  LogList.Add('Поле "Дата заполнения"');
    //  LogList.Add(Format('Старое значение: %s', [FCard.CreateDate]));
    //  LogList.Add(Format('Новое значение : %s', [dtCreateDate.Text]));
    //  LogList.Add('<------->');
    //end;
    if (FCard.OldEquipmentName <> cbEquipment.Text) then begin
      LogList.Add('Поле "Оборудование"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldEquipmentName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldEquipmentID]));
      LogList.Add(Format('Новое значение : %s', [cbEquipment.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.EquipmentID]));
      LogList.Add('<------->');
    end;
    CompareDates('Поле "Окончание договора"', FCard.EndContract, dtEndContract.Text);
    //if (FCard.EndContract <> dtEndContract.Text) then begin
    //  LogList.Add('Поле "Окончание договора"');
    //  LogList.Add(Format('Старое значение: %s', [FCard.EndContract]));
    //  LogList.Add(Format('Новое значение : %s', [dtEndContract.Text]));
    //  LogList.Add('<------->');
    //end;
    if (FCard.Repaid <> chRepaid.Checked) then begin
      LogList.Add('Поле "Погашено"');
      LogList.Add(Format('Старое значение: %s', [IsChecked(FCard.Repaid)]));
      LogList.Add(Format('Новое значение : %s', [IsChecked(chRepaid.Checked)]));
      LogList.Add('<------->');
    end;
    CompareDates('Поле "Кредит до"', FCard.CreditTo, dtCreditTo.Text);
    //if (FCard.CreditTo <> dtCreditTo.Text) then begin
    //  LogList.Add('Поле "Кредит до"');
    //  LogList.Add(Format('Старое значение: %s', [FCard.CreditTo]));
    //  LogList.Add(Format('Новое значение : %s', [dtCreditTo.Text]));
    //  LogList.Add('<------->');
    //end;
    if (FCard.OldCityName <> cbCities.Text) then begin
      LogList.Add('Поле "Город"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldCityName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldCityID]));
      LogList.Add(Format('Новое значение : %s', [cbCities.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.CityID]));
      LogList.Add('<------->');
    end;
    if (FCard.OldStreetName <> cbStreets.Text) then begin
      LogList.Add('Поле "Улица"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldStreetName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldStreetID]));
      LogList.Add(Format('Новое значение : %s', [cbStreets.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.StreetID]));
      LogList.Add('<------->');
    end;
    if (FCard.OldHouseNumber <> cbHouses.Text) then begin
      LogList.Add('Поле "Дом"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldHouseNumber]));
      LogList.Add(Format('Старый код: %d', [FCard.OldHouseID]));
      LogList.Add(Format('Новое значение : %s', [cbHouses.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.HouseID]));
      LogList.Add('<------->');
    end;
    if not ((FCard.Porch = 0) and (edPorch.Text = '')) then begin
      if (IntToStr(FCard.Porch)) <> edPorch.Text then begin
        LogList.Add('Поле "Подъезд"');
        LogList.Add(Format('Старое значение: %d', [FCard.Porch]));
        LogList.Add(Format('Новое значение : %s', [edPorch.Text]));
        LogList.Add('<------->');
      end;
    end;
    if (FCard.Numeration <> edNumeration.Text) then begin
      LogList.Add('Поле "Нумерация"');
      LogList.Add(Format('Старое значение: %s', [FCard.Numeration]));
      LogList.Add(Format('Новое значение : %s', [edNumeration.Text]));
      LogList.Add('<------->');
    end;
    if (FCard.OrderDateDoor <> dtOrderDateDoor.Text) then begin
      LogList.Add('Поле "Дата заказа двери"');
      LogList.Add(Format('Старое значение: %s', [FCard.OrderDateDoor]));
      LogList.Add(Format('Новое значение : %s', [dtOrderDateDoor.Text]));
      LogList.Add('<------->');
    end;
    if (FCard.WillingnessDateDoor <> dtWillingnessDateDoor.Text) then begin
      LogList.Add('Поле "Фактическая готовность двери"');
      LogList.Add(Format('Старое значение: %s', [FCard.WillingnessDateDoor]));
      LogList.Add(Format('Новое значение : %s', [dtWillingnessDateDoor.Text]));
      LogList.Add('<------->');
    end;
    if (FCard.OldBrigadeName <> cbBrigade.Text) then begin
      LogList.Add('Поле "Боигада монтажников"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldBrigadeName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldBrigadeID]));
      LogList.Add(Format('Новое значение : %s', [cbBrigade.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.BrigadeID]));
      LogList.Add('<------->');
    end;
    if (FCard.OldMountingName <> cbMounting.Text) then begin
      LogList.Add('Поле "Установка трубок"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldMountingName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldMounting]));
      LogList.Add(Format('Новое значение : %s', [cbMounting.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.Mounting]));
      LogList.Add('<------->');
    end;
    // Закладка "Старший по договору"
    if (FCard.OldClientName <> cbClients.Text) then begin
      LogList.Add('Поле "Клиент по договору"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldClientName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldClientID]));
      LogList.Add(Format('Новое значение : %s', [cbClients.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.ClientID]));
      LogList.Add('<------->');
    end;
    // Техобслуживание
    if (FCard.OldMaintenanceContractName <> cbMaintenanceContract.Text) then begin
      LogList.Add('Поле "Договор ТО"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldMaintenanceContractName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldMaintenanceContract]));
      LogList.Add(Format('Новое значение : %s', [cbMaintenanceContract.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.MaintenanceContract]));
      LogList.Add('<------->');
    end;
    CompareDates('Поле "Дата ТО с"', FCard.StartService, dtStartService.Text);
    //if (FCard.StartService <> dtStartService.Text) then begin
    //  LogList.Add('Поле "Дата ТО с"');
    //  LogList.Add(Format('Старое значение: %s', [FCard.StartService]));
    //  LogList.Add(Format('Новое значение : %s', [dtStartService.Text]));
    //  LogList.Add('<------->');
    //end;
    CompareDates('Поле "Дата ТО по"', FCard.EndService, dtEndService.Text);
    //if (FCard.EndService <> dtEndService.Text) then begin
    //  LogList.Add('Поле "Дата ТО по"');
    //  LogList.Add(Format('Старое значение: %s', [FCard.EndService]));
    //  LogList.Add(Format('Новое значение : %s', [dtEndService.Text]));
    //  LogList.Add('<------->');
    //end;
    if (FCard.MContractNumber <> edContractNumber.Text) then begin
      LogList.Add('Поле "Номер договора"');
      LogList.Add(Format('Старое значение: %s', [FCard.MContractNumber]));
      LogList.Add(Format('Новое значение : %s', [edContractNumber.Text]));
      LogList.Add('<------->');
    end;
    CompareDates('Поле "Пролонгирован до"', FCard.MProlongation, dtProlongation.Text);
    //if (FCard.MProlongation <> dtProlongation.Text) then begin
    //  LogList.Add('Поле "Пролонгирован до"');
    //  LogList.Add(Format('Старое значение: %s', [FCard.MProlongation]));
    //  LogList.Add(Format('Новое значение : %s', [dtProlongation.Text]));
    //  LogList.Add('<------->');
    //end;
    if (FCard.MRepaid <> chmRepaid.Checked) then begin
      LogList.Add('Поле "Внимание"');
      LogList.Add(Format('Старое значение: %s', [IsChecked(FCard.Repaid)]));
      LogList.Add(Format('Новое значение : %s', [IsChecked(chmRepaid.Checked)]));
      LogList.Add('<------->');
    end;
    if not ((FCard.MPayment = 0) and (edPayment.Text = '')) then begin
      if (IntToStr(FCard.MPayment) <> edPayment.Text) then begin
        LogList.Add('Поле "Оплата по квитанциям ТО за год"');
        LogList.Add(Format('Старое значение: %d', [FCard.MPayment]));
        LogList.Add(Format('Новое значение : %s', [edPayment.Text]));
        LogList.Add('<------->');
      end;
    end;
    if (FCard.OldMPaymentTypeName <> cbPaymentTypes.Text) then begin
      LogList.Add('Поле "Оборудование"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldMPaymentTypeName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldMPaymentTypeID]));
      LogList.Add(Format('Новое значение : %s', [cbPaymentTypes.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.MPaymentTypeID]));
      LogList.Add('<------->');
    end;
    if not ((FCard.MStartApartment = 0) and (edStartApartment.Text = '')) then begin
      if (IntToStr(FCard.MStartApartment)) <> edStartApartment.Text then begin
        LogList.Add('Поле "Номер квартиры с"');
        LogList.Add(Format('Старое значение: %d', [FCard.MStartApartment]));
        LogList.Add(Format('Новое значение : %s', [edStartApartment.Text]));
        LogList.Add('<------->');
      end;
    end;
    if not ((FCard.MEndApartment = 0) and (edEndApartment.Text = '')) then begin
      if (IntToStr(FCard.MEndApartment)) <> edEndApartment.Text then begin
        LogList.Add('Поле "Номер квартиры по"');
        LogList.Add(Format('Старое значение: %d', [FCard.MEndApartment]));
        LogList.Add(Format('Новое значение : %s', [edEndApartment.Text]));
        LogList.Add('<------->');
      end;
    end;
    if (FCard.NormalPayment <> edNormalPayment.Value) then begin
      LogList.Add('Поле "Обычная плата"');
      LogList.Add(Format('Старое значение: %f', [FCard.NormalPayment + 0.00]));
      LogList.Add(Format('Новое значение : %f', [edNormalPayment.Value]));
      LogList.Add('<------->');
    end;
    if (FCard.PrivilegePayment  <> edPrivilegePayment.Value) then begin
      LogList.Add('Поле "Льготная плата"');
      LogList.Add(Format('Старое значение: %f', [FCard.PrivilegePayment + 0.00]));
      LogList.Add(Format('Новое значение : %f', [edPrivilegePayment.Value]));
      LogList.Add('<------->');
    end;

    // Дата печати квитанций
    CompareDates('Поле "Дата печати квитанций"', FCard.ReceiptPrinting, dtReceiptPrinting.Text);

    //if (FCard.ReceiptPrinting <> '') then begin
    //  Compare.OutDate := StrToDate(FCard.ReceiptPrinting, FormatSettings);
    //  Compare.OutString := FormatDateTime('dd.mm.yyyy', Compare.OutDate);
    //  if (Compare.OutString <> dtReceiptPrinting.Text) then begin
    //    LogList.Add('Поле "Дата печати квитанций"');
    //    LogList.Add(Format('Старое значение: %s', [Compare.OutString]));
    //    LogList.Add(Format('Новое значение : %s', [dtReceiptPrinting.Text]));
    //    LogList.Add('<------->');
    //  end
    //end
    //else begin
    //  if (FCard.ReceiptPrinting <> dtReceiptPrinting.Text) then begin
    //    LogList.Add('Поле "Дата печати квитанций"');
    //    LogList.Add(Format('Старое значение: %s', [FCard.ReceiptPrinting]));
    //    LogList.Add(Format('Новое значение : %s', [dtReceiptPrinting.Text]));
    //    LogList.Add('<------->');
    //  end;
    //end;

    // Закладка "Старший по техобслуживанию"
    if (FCard.OldMClientName <> cbMClients.Text) then begin
      LogList.Add('Поле "Клиент по ТО"');
      LogList.Add(Format('Старое значение: %s', [FCard.OldMClientName]));
      LogList.Add(Format('Старый код: %d', [FCard.OldMClientID]));
      LogList.Add(Format('Новое значение : %s', [cbMClients.Text]));
      LogList.Add(Format('Новый код: %d', [FCard.MClientID]));
      LogList.Add('<------->');
    end;
    if (FCard.OnePerson <> chOnePerson.Checked) then begin
      LogList.Add('Поле "Клиент по договору и клиент по ТО - одно и то же лицо"');
      LogList.Add(Format('Старое значение: %s', [IsChecked(FCard.OnePerson)]));
      LogList.Add(Format('Новое значение : %s', [IsChecked(chOnePerson.Checked)]));
      LogList.Add('<------->');
    end;
    // Закладка "Дополнительно"
    if (FCard.Attention <> chAttention.Checked) then begin
      LogList.Add('Поле "Внимание"');
      LogList.Add(Format('Старое значение: %s', [IsChecked(FCard.Attention)]));
      LogList.Add(Format('Новое значение : %s', [IsChecked(chAttention.Checked)]));
      LogList.Add('<------->');
    end;
    if (FCard.DuplicateMaintenance <> chDuplicateMaintenance.Checked) then begin
      LogList.Add('Поле "Дубликат ТО"');
      LogList.Add(Format('Старое значение: %s', [IsChecked(FCard.DuplicateMaintenance)]));
      LogList.Add(Format('Новое значение : %s', [IsChecked(chDuplicateMaintenance.Checked)]));
      LogList.Add('<------->');
    end;
    if (CompareStr(FCard.ContractInfo, edContractInfo.Lines.Text) <> 0) then begin
      LogList.Add('Поле "Информация по договору"');
      LogList.Add('Старое значение:');
      LogList.Add(Format('%s', [FCard.ContractInfo]));
      LogList.Add('---------');
      LogList.Add('Новое значение:');
      LogList.Add(Format('%s', [edContractInfo.Lines.Text]));
      LogList.Add('<------->');
    end;
    if (CompareStr(FCard.ServiceInfo, edServiceInfo.Lines.Text) <> 0) then begin
      LogList.Add('Поле "Информация по обслуживанию"');
      LogList.Add('Старое значение:');
      LogList.Add(Format('%s', [FCard.ServiceInfo]));
      LogList.Add('---------');
      LogList.Add('Новое значение:');
      LogList.Add(Format('%s', [edServiceInfo.Lines.Text]));
      LogList.Add('<------->');
    end;
    //
    if (FClearIndicationPayments) then begin
      LogList.Add('Была нажата кнопка "Очистить оплачено"');
      LogList.Add('<------->');
    end;
    // Квартиры
    //grdApartments.BeginUpdate;
    FApartments.DisableControls;
    //GetMem(BM, SizeOf(BM));
    BM := FApartments.Bookmark;
    FApartments.First;
    repeat
      FOldApartments.First;
      repeat
        if FApartments.FieldByName('apartment_id').AsInteger = FOldApartments.FieldByName('apartment_id').AsInteger then begin
          //if FApartments.FieldByName('number').AsInteger <> FOldApartments.FieldByName('number').AsInteger then begin
          //    LogList.Add('Поле "Номер квартиры"');
          //    LogList.Add('Старое значение:');
          //    LogList.Add(Format('%d', [FOldApartments.FieldByName('number').AsInteger]));
          //    LogList.Add('---------');
          //    LogList.Add('Новое значение:');
          //    LogList.Add(Format('%d', [FApartments.FieldByName('number').AsInteger]));
          //    LogList.Add('<------->');
          //end;
          if FApartments.FieldByName('letter').AsInteger <> FOldApartments.FieldByName('letter').AsInteger then begin
              LogList.Add(Format('Квартира: %d%s', [FApartments.FieldByName('number').AsInteger, EncodeApartmentLetter(FApartments.FieldByName('letter').AsInteger)]));
              LogList.Add('Поле "Буква"');
              LogList.Add('Старое значение:');
              LogList.Add(Format('%s', [EncodeApartmentLetter(FOldApartments.FieldByName('letter').AsInteger)]));
              LogList.Add('---------');
              LogList.Add('Новое значение:');
              LogList.Add(Format('%s', [EncodeApartmentLetter(FApartments.FieldByName('letter').AsInteger)]));
              LogList.Add('<------->');
          end;
          if FApartments.FieldByName('paid').AsInteger <> FOldApartments.FieldByName('paid').AsInteger then begin
              LogList.Add(Format('Квартира: %d%s', [FApartments.FieldByName('number').AsInteger, EncodeApartmentLetter(FApartments.FieldByName('letter').AsInteger)]));
              LogList.Add('Поле "Оплачено"');
              LogList.Add('Старое значение:');
              LogList.Add(Format('%s', [IsChecked(FOldApartments.FieldByName('paid').AsInteger > 0)]));
              LogList.Add('---------');
              LogList.Add('Новое значение:');
              LogList.Add(Format('%s', [IsChecked(FApartments.FieldByName('paid').AsInteger > 0)]));
              LogList.Add('<------->');
          end;
          if FApartments.FieldByName('privilege').AsInteger <> FOldApartments.FieldByName('privilege').AsInteger then begin
              LogList.Add(Format('Квартира: %d%s', [FApartments.FieldByName('number').AsInteger, EncodeApartmentLetter(FApartments.FieldByName('letter').AsInteger)]));
              LogList.Add('Поле "Льготник"');
              LogList.Add('Старое значение:');
              LogList.Add(Format('%s', [IsChecked(FOldApartments.FieldByName('privilege').AsInteger > 0)]));
              LogList.Add('---------');
              LogList.Add('Новое значение:');
              LogList.Add(Format('%s', [IsChecked(FApartments.FieldByName('privilege').AsInteger > 0)]));
              LogList.Add('<------->');
          end;
          if FApartments.FieldByName('exempt').AsInteger <> FOldApartments.FieldByName('exempt').AsInteger then begin
              LogList.Add(Format('Квартира: %d%s', [FApartments.FieldByName('number').AsInteger, EncodeApartmentLetter(FApartments.FieldByName('letter').AsInteger)]));
              LogList.Add('Поле "Освоб. от уплаты"');
              LogList.Add('Старое значение:');
              LogList.Add(Format('%s', [IsChecked(FOldApartments.FieldByName('exempt').AsInteger > 0)]));
              LogList.Add('---------');
              LogList.Add('Новое значение:');
              LogList.Add(Format('%s', [IsChecked(FApartments.FieldByName('exempt').AsInteger > 0)]));
              LogList.Add('<------->');
          end;
          if FApartments.FieldByName('locked').AsInteger <> FOldApartments.FieldByName('locked').AsInteger then begin
              LogList.Add(Format('Квартира: %d%s', [FApartments.FieldByName('number').AsInteger, EncodeApartmentLetter(FApartments.FieldByName('letter').AsInteger)]));
              LogList.Add('Поле "Забл.-ван"');
              LogList.Add('Старое значение:');
              LogList.Add(Format('%s', [IsChecked(FOldApartments.FieldByName('locked').AsInteger > 0)]));
              LogList.Add('---------');
              LogList.Add('Новое значение:');
              LogList.Add(Format('%s', [IsChecked(FApartments.FieldByName('locked').AsInteger > 0)]));
              LogList.Add('<------->');
          end;
          break;
        end;
        FOldApartments.Next;
      until FOldApartments.Eof;
      FApartments.Next;
    until FApartments.Eof;
    FApartments.Bookmark := BM;
    //FApartments.FreeBookmark(BM);
    FApartments.EnableControls;
    // 22 Aug 2016
    //FOldApartments.Clear;
    //FOldApartments.CopyFromDataset(FApartments, True);
    //if (FOldApartments <> nil) then begin
    //  FOldApartments.Close;
    //  FOldApartments.Free;
    //  FOldApartments := TMemDataset.Create(nil);
    //  FOldApartments.CopyFromDataset(FApartments, True);
    //  FOldApartments.Open;
    //end;
    //
    //grdApartments.EndUpdate;
    if (LogList.Count > 0) then begin
      DM.qryInsertLog.Close;
      DM.qryInsertLog.Params.ParamByName('p_description').Value := LogList.Text;
      DM.qryInsertLog.Params.ParamByName('p_card_id').Value := FCard.CardID;
      DM.qryInsertLog.Params.ParamByName('p_number').Value := fMain.IntercomsSettings.Number;
      DM.qryInsertLog.ExecSQL;
    end;
  finally
    if (Assigned(LogList)) then
      LogList.Free;
  end;
  //try
  //  LogList := TStringList.Create;
  //  // Закладка "Основное"
  //  if (FCard.Repaid <> chRepaid.Checked) then begin
  //    LogList.Add('Поле "Погашено"');
  //    LogList.Add(Format('Старое значение: %s', [IsChecked(FCard.Repaid)]));
  //    LogList.Add(Format('Новое значение : %s', [IsChecked(chRepaid.Checked)]));
  //    LogList.Add('<------->');
  //  end;
  //  // Закладка "Дополнительно"
  //  if (FCard.Attention <> chAttention.Checked) then begin
  //    LogList.Add('Поле "Внимание"');
  //    LogList.Add(Format('Старое значение: %s', [IsChecked(FCard.Attention)]));
  //    LogList.Add(Format('Новое значение : %s', [IsChecked(chAttention.Checked)]));
  //    LogList.Add('<------->');
  //  end;
  //  if (CompareStr(FCard.ContractInfo, Trim(edContractInfo.Lines.Text)) <> 0) then begin
  //    LogList.Add('Поле "Информация по договору"');
  //    LogList.Add('Старое значение:');
  //    LogList.Add(Format('%s', [FCard.ContractInfo]));
  //    LogList.Add('---------');
  //    LogList.Add('Новое значение:');
  //    LogList.Add(Format('%s', [edContractInfo.Lines.Text]));
  //    LogList.Add('<------->');
  //  end;
  //  if (CompareStr(FCard.ServiceInfo, Trim(edServiceInfo.Lines.Text)) <> 0) then begin
  //    LogList.Add('Поле "Информация по обслуживанию"');
  //    LogList.Add('Старое значение:');
  //    LogList.Add(Format('%s', [FCard.ServiceInfo]));
  //    LogList.Add('---------');
  //    LogList.Add('Новое значение:');
  //    LogList.Add(Format('%s', [edServiceInfo.Lines.Text]));
  //    LogList.Add('<------->');
  //  end;
  //  if (LogList.Count > 0) then begin
  //    DM.qryInsertLog.Close;
  //    DM.qryInsertLog.Params.ParamByName('p_description').Value := LogList.Text;
  //    DM.qryInsertLog.Params.ParamByName('p_card_id').Value := FCard.CardID;
  //    DM.qryInsertLog.ExecSQL;
  //  end;
  //finally
  //  if (Assigned(LogList)) then
  //    LogList.Free;
  //end;
end;

procedure TfmNewCard.SaveCard(AValue: Integer);
var
  qrySave: TZQuery;
  BM: TBookmark;
  var DebugSQLString: String;
begin
//
//  FCard.ContractNumber := StrToInt(edCardId.Text);
//  FCard.CreateDate := FormatDateTime('yyyy-mm-dd', dtCreateDate.Date);
//  FCard.EquipmentID := Integer(cbEquipment.Items.Objects[cbEquipment.ItemIndex]);
//
//  if dtEndContract.Text <> '' then
//    FCard.EndContract := FormatDateTime('yyyy-mm-dd', dtEndContract.Date)
//  else
//    FCard.EndContract := '';
//
//  if dtEndService.Text <> '' then
//    FCard.EndService := FormatDateTime('yyyy-mm-dd', dtEndService.Date)
//  else
//    FCard.EndService := '';
//
//  FCard.Repaid := chRepaid.Checked;
//  FCard.CreditTo := FormatDateTime('yyyy-mm-dd', dtCreditTo.Date);
//  FCard.CityID := Integer(cbCities.Items.Objects[cbCities.ItemIndex]);
//  FCard.StreetID := Integer(cbStreets.Items.Objects[cbStreets.ItemIndex]);
//  FCard.HouseID := Integer(cbHouses.Items.Objects[cbHouses.ItemIndex]);
//  FCard.Porch := StrToInt(edPorch.Text);
//  FCard.Numeration := edNumeration.Text;
//
//  if dtOrderDateDoor.Text <> '' then
//    FCard.OrderDateDoor := FormatDateTime('yyyy-mm-dd', dtOrderDateDoor.Date)
//  else
//    FCard.OrderDateDoor := '';
//
//  if dtWillingnessDateDoor.Text <> '' then
//    FCard.WillingnessDateDoor := FormatDateTime('yyyy-mm-dd', dtWillingnessDateDoor.Date)
//  else
//    FCard.WillingnessDateDoor := '';
//
//  FCard.BrigadeID := Integer(cbBrigade.Items.Objects[cbBrigade.ItemIndex]);
//  FCard.Mounting := Integer(cbMounting.Items.Objects[cbMounting.ItemIndex]);
//  FCard.ClientID := Integer(cbClients.Items.Objects[cbClients.ItemIndex]);
//  FCard.MClientID := Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);
//
//  FCard.OnePerson := chOnePerson.Checked;
//  FCard.MaintenanceContract := cbMaintenanceContract.ItemIndex;
//
//  if dtStartService.Text <> '' then
//    FCard.StartService := FormatDateTime('yyyy-mm-dd', dtStartService.Date)
//  else
//    FCard.StartService := '';
//
//  if dtEndService.Text <> '' then
//    FCard.EndService := FormatDateTime('yyyy-mm-dd', dtEndService.Date)
//  else                                                                                                     FCard.StartService
//    FCard.EndService := '';
//
//  FCard.MContractNumber := edContractNumber.Text;
//  if dtProlongation.Text <> '' then
//    FCard.MProlongation := FormatDateTime('yyyy-mm-dd', dtProlongation.Date)
//  else
//    FCard.MProlongation := '';
//
//  FCard.MRepaid := chmRepaid.Checked;
//  if edPayment.Text <> '' then
//    FCard.MPayment := StrToInt(edPayment.Text)
//  else
//    FCard.MPayment := 0;
//  FCArd.MPaymentTypeID := Integer(cbPaymentTypes.Items.Objects[cbPaymentTypes.ItemIndex]);
//  if edStartApartment.Text <> '' then
//    FCard.MStartApartment := StrToInt(edStartApartment.Text)
//  else
//    FCard.MStartApartment := 0;
//  if edEndApartment.Text <> '' then
//    FCard.MEndApartment := StrToInt(edEndApartment.Text)
//  else
//    FCard.MEndApartment := 0;
//  if edNormalPayment.Text = '' then
//    FCard.NormalPayment := 0
//  else
//     FCard.NormalPayment := StrToCurr(edNormalPayment.Text);
//  if edPrivilegePayment.Text = '' then
//    FCard.PrivilegePayment := 0
//  else
//    FCard.PrivilegePayment := StrToCurr(edPrivilegePayment.Text);
//  if dtReceiptPrinting.Text <> '' then
//    FCard.ReceiptPrinting:= FormatDateTime('yyyy-mm-dd', dtReceiptPrinting.Date)
//  else
//    FCard.ReceiptPrinting := '';
//
//  FCard.Attention := chAttention.Checked;
//  FCard.ContractInfo := StringReplace(edContractInfo.Lines.Text, '\', '', [rfReplaceAll, rfIgnoreCase]);
//  FCard.ServiceInfo := StringReplace(edServiceInfo.Lines.Text, '\', '', [rfReplaceAll, rfIgnoreCase]);

  // Записать в базу данных!
  qrySave := TZQuery.Create(nil);
  qrySave.Connection := DM.DBConn;
  qrySave.Close;
  if FCard.CardID > 0 then begin

    qrySave.SQL.Text := 'UPDATE cards SET';

    qrySave.SQL.Add(Format('contract_number=%d,', [FCard.ContractNumber]));
    qrySave.SQL.Add(Format('create_date=''%s'',', [FCard.CreateDate]));
    qrySave.SQL.Add(Format('equipment_id=%d,', [FCard.EquipmentID]));

    if (FCard.EndContract <> '') then
      qrySave.SQL.Add(Format('end_contract=''%s'',', [FCard.EndContract]))
    else
      qrySave.SQL.Add('end_contract=NULL,');

    //if (FCard.EndService <> '') then
    //  qrySave.SQL.Add(Format('end_service=''%s'',', [FCard.EndService]))
    //else
    //  qrySave.SQL.Add('end_service=NULL,');

    qrySave.SQL.Add(Format('repaid=%d,', [Integer(FCard.Repaid)]));

    if (FCard.CreditTo <> '') then
      qrySave.SQL.Add(Format('credit_to=''%s'',', [FCard.CreditTo]))
    else
      qrySave.SQL.Add('credit_to=NULL,');

    qrySave.SQL.Add(Format('city_id=%d,', [FCard.CityID]));
    qrySave.SQL.Add(Format('street_id=%d,', [FCard.StreetID]));
    qrySave.SQL.Add(Format('house_id=%d,', [FCard.HouseID]));
    qrySave.SQL.Add(Format('porch=%d,', [FCard.Porch]));
    qrySave.SQL.Add(Format('numeration=''%s'',', [FCard.Numeration]));

    if (FCard.OrderDateDoor <> '') then
      qrySave.SQL.Add(Format('order_date_door=''%s'',', [FCard.OrderDateDoor]))
    else
      qrySave.SQL.Add('order_date_door=NULL,');

    if (FCard.WillingnessDateDoor <> '') then
      qrySave.SQL.Add(Format('willingness_date_door=''%s'',', [FCard.WillingnessDateDoor]))
    else
      qrySave.SQL.Add('willingness_date_door=NULL,');

    qrySave.SQL.Add(Format('brigade_id=%d,', [FCard.BrigadeID]));
    qrySave.SQL.Add(Format('mounting=%d,', [FCard.Mounting]));

    qrySave.SQL.Add(Format('client_id=%d,', [FCard.ClientID]));

    qrySave.SQL.Add(Format('maintenance_contract=%d,', [FCard.MaintenanceContract]));

    if (FCard.StartService <> '') then
      qrySave.SQL.Add(Format('start_service=''%s'',', [FCard.StartService]))
    else
      qrySave.SQL.Add('start_service=NULL,');

    if (FCard.EndService <> '') then
      qrySave.SQL.Add(Format('end_service=''%s'',', [FCard.EndService]))
    else
      qrySave.SQL.Add('end_service=NULL,');

    qrySave.SQL.Add(Format('m_contract_number=''%s'',', [FCard.MContractNumber]));

    if (FCard.MProlongation <> '') then
      qrySave.SQL.Add(Format('m_prolongation=''%s'',', [FCard.MProlongation]))
    else
      qrySave.SQL.Add('m_prolongation=NULL,');

    qrySave.SQL.Add(Format('m_repaid=%d,', [Integer(FCard.MRepaid)]));
    qrySave.SQL.Add(Format('m_payment=%d,', [FCard.MPayment]));
    qrySave.SQL.Add(Format('m_payment_type_id=%d,', [FCard.MPaymentTypeID]));
    qrySave.SQL.Add(Format('m_start_apartment=%d,', [FCard.MStartApartment]));
    qrySave.SQL.Add(Format('m_end_apartment=%d,', [FCard.MEndApartment]));
    qrySave.SQL.Add(Format('normal_payment=%s,', [ExtReplace(CurrToStr(FCard.NormalPayment), ',', '.')]));
    qrySave.SQL.Add(Format('privilege_payment=%s,', [ExtReplace(CurrToStr(FCard.PrivilegePayment), ',', '.')]));

    //ShowMessage(ExtReplace(CurrToStr(FCard.NormalPayment), ',', '.'));
    //ShowMessage(CurrToStr(FCard.PrivilegePayment));

    if (FCard.ReceiptPrinting <> '') then
      qrySave.SQL.Add(Format('receipt_printing=''%s'',', [FCard.ReceiptPrinting]))
    else
      qrySave.SQL.Add('receipt_printing=NULL,');

    qrySave.SQL.Add(Format('m_client_id=%d,', [FCard.MClientID]));
    qrySave.SQL.Add(Format('is_one_person=%d,', [Integer(FCard.OnePerson)]));

    qrySave.SQL.Add(Format('attention=%d,', [Integer(FCard.Attention)]));
    qrySave.SQL.Add(Format('m_duplicate=%d,', [Integer(FCard.DuplicateMaintenance)]));
    qrySave.SQL.Add(Format('contract_info=''%s'',', [FCard.ContractInfo]));
    qrySave.SQL.Add(Format('service_info=''%s'',', [FCard.ServiceInfo]));
    qrySave.SQL.Add(Format('last_save_date=''%s''', [FormatDateTime('yyyy-mm-dd hh:mm:ss', Now)]));

    qrySave.SQL.Add(Format('WHERE card_id=%d',[FCard.CardID]));

    //DebugSQLString := qrySave.SQL.Text;
    //qrySave.SQL.SaveToFile('d:\test111.sql');

    qrySave.ExecSQL;
  end
  else begin

    qrySave.SQL.Text := 'INSERT INTO cards (';

    qrySave.SQL.Add('contract_number,');
    qrySave.SQL.Add('create_date,');
    qrySave.SQL.Add('equipment_id,');
    qrySave.SQL.Add('end_contract,');
    //qrySave.SQL.Add('end_service,');

    qrySave.SQL.Add('repaid,');
    qrySave.SQL.Add('credit_to,');
    qrySave.SQL.Add('city_id,');
    qrySave.SQL.Add('street_id,');
    qrySave.SQL.Add('house_id,');
    qrySave.SQL.Add('porch,');
    qrySave.SQL.Add('numeration,');

    qrySave.SQL.Add('order_date_door,');
    qrySave.SQL.Add('willingness_date_door,');
    qrySave.SQL.Add('brigade_id,');
    qrySave.SQL.Add('mounting,');
    qrySave.SQL.Add('client_id,');

    qrySave.SQL.Add('maintenance_contract,');
    qrySave.SQL.Add('start_service,');
    qrySave.SQL.Add('end_service,');
    qrySave.SQL.Add('m_contract_number,');
    qrySave.SQL.Add('m_prolongation,');
    qrySave.SQL.Add('m_repaid,');
    qrySave.SQL.Add('m_payment,');
    qrySave.SQL.Add('m_payment_type_id,');
    qrySave.SQL.Add('m_start_apartment,');
    qrySave.SQL.Add('m_end_apartment,');
    qrySave.SQL.Add('normal_payment,');
    qrySave.SQL.Add('privilege_payment,');
    qrySave.SQL.Add('receipt_printing,');

    qrySave.SQL.Add('m_client_id,');
    qrySave.SQL.Add('is_one_person,');

    qrySave.SQL.Add('attention,');
    qrySave.SQL.Add('m_duplicate,');
    qrySave.SQL.Add('contract_info,');
    qrySave.SQL.Add('service_info,');
    qrySave.SQL.Add('last_save_date');

    qrySave.SQL.Add(')');

    qrySave.SQL.Add('VALUES (');

    qrySave.SQL.Add(Format('%d,', [FCard.ContractNumber]));
    qrySave.SQL.Add(Format('''%s'',', [FCard.CreateDate]));
    qrySave.SQL.Add(Format('%d,', [FCard.EquipmentID]));
    if (FCard.EndContract <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.EndContract]))
    else
      qrySave.SQL.Add('NULL,');

    //if (FCard.EndService <> '') then
    //  qrySave.SQL.Add(Format('''%s'',', [FCard.EndService]))
    //else
    //  qrySave.SQL.Add('NULL,');

    qrySave.SQL.Add(Format('%d,', [Integer(FCard.Repaid)]));

    if (FCard.CreditTo <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.CreditTo]))
    else
      qrySave.SQL.Add('NULL,');

    qrySave.SQL.Add(Format('%d,', [Integer(FCard.CityID)]));
    qrySave.SQL.Add(Format('%d,', [Integer(FCard.StreetID)]));
    qrySave.SQL.Add(Format('%d,', [Integer(FCard.HouseID)]));
    qrySave.SQL.Add(Format('%d,', [Integer(FCard.Porch)]));
    qrySave.SQL.Add(Format('''%s'',', [FCard.Numeration]));

    if (FCard.OrderDateDoor <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.OrderDateDoor]))
    else
      qrySave.SQL.Add('NULL,');

    if (FCard.WillingnessDateDoor <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.WillingnessDateDoor]))
    else
      qrySave.SQL.Add('NULL,');

    qrySave.SQL.Add(Format('%d,', [Integer(FCard.BrigadeID)]));
    qrySave.SQL.Add(Format('%d,', [Integer(FCard.Mounting)]));

    qrySave.SQL.Add(Format('%d,', [Integer(FCard.ClientID)]));

    qrySave.SQL.Add(Format('%d,', [FCard.MaintenanceContract]));

    if (FCard.StartService <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.StartService]))
    else
      qrySave.SQL.Add('NULL,');

    if (FCard.EndService <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.EndService]))
    else
      qrySave.SQL.Add('NULL,');

    qrySave.SQL.Add(Format('''%s'',', [FCard.MContractNumber]));

    if (FCard.MProlongation <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.MProlongation]))
    else
      qrySave.SQL.Add('NULL,');

    qrySave.SQL.Add(Format('%d,', [Integer(FCard.MRepaid)]));
    qrySave.SQL.Add(Format('%d,', [FCard.MPayment]));
    qrySave.SQL.Add(Format('%d,', [FCard.MPaymentTypeID]));
    qrySave.SQL.Add(Format('%d,', [FCard.MStartApartment]));
    qrySave.SQL.Add(Format('%d,', [FCard.MEndApartment]));
    qrySave.SQL.Add(Format('''%s'',', [CurrToStr(FCard.NormalPayment)]));
    qrySave.SQL.Add(Format('''%s'',', [CurrToStr(FCard.PrivilegePayment)]));

    if (FCard.ReceiptPrinting <> '') then
      qrySave.SQL.Add(Format('''%s'',', [FCard.ReceiptPrinting]))
    else
      qrySave.SQL.Add('NULL,');

    qrySave.SQL.Add(Format('%d,', [Integer(FCard.MClientID)]));
    qrySave.SQL.Add(Format('%d,', [Integer(FCard.OnePerson)]));

    qrySave.SQL.Add(Format('%d,', [Integer(FCard.Attention)]));
    qrySave.SQL.Add(Format('%d,', [Integer(FCard.DuplicateMaintenance)]));
    qrySave.SQL.Add(Format('''%s'',', [FCard.ContractInfo]));
    qrySave.SQL.Add(Format('''%s'',', [FCard.ServiceInfo]));
    qrySave.SQL.Add(Format('''%s''', [FormatDateTime('yyyy-mm-dd hh:mm:ss', Now)]));

    qrySave.SQL.Add(')');
    //qrySave.SQL.SaveToFile('d:\test111.sql');

    //DebugSQLString := qrySave.SQL.Text;

    qrySave.ExecSQL;

    DM.qryLastCardID.Close;
    DM.qryLastCardID.Open;
    FLastCardID := DM.qryLastCardID.FieldByName('last_card_id').AsInteger;

    FCard.CardID := FLastCardID;
    FOldContractNumber := FCard.ContractNumber;
    DocumentStatus;
  end;
  qrySave.Free;
  //
  //grdApartments.DataSource.Dataset.DisableControls;

  //
  // Запись квартир
  //
  FApartments.DisableControls;
  //GetMem(BM, SizeOf(BM));
  BM := FApartments.BookMark;
  if not FApartments.IsEmpty then begin
    FApartments.First;
    repeat
      if FApartments.FieldByName('apartment_id').AsInteger = 0 then begin
        DM.qryDeleteFromApartments.Close;
        DM.qryDeleteFromApartments.SQL.Text := Format('insert into apartments (paid, number, letter, privilege, exempt, half_paid, locked, card_id) values (%d, %d, %d, %d, %d, %d, %d, %d)',
          [FApartments.FieldByName('paid').AsInteger,
          FApartments.FieldByName('number').AsInteger,
          FApartments.FieldByName('letter').AsInteger,
          FApartments.FieldByName('privilege').AsInteger,
          FApartments.FieldByName('exempt').AsInteger,
          FApartments.FieldByName('half_paid').AsInteger,
          FApartments.FieldByName('locked').AsInteger,
          FLastCardID]);
        DM.qryDeleteFromApartments.ExecSQL;
      end
      else begin
        DM.qryDeleteFromApartments.Close;
        DM.qryDeleteFromApartments.SQL.Text := Format('update apartments set paid=%d, number=%d, letter=%d, privilege=%d, exempt=%d, half_paid=%d, locked=%d where apartment_id=%d',
          [FApartments.FieldByName('paid').AsInteger,
          FApartments.FieldByName('number').AsInteger,
          FApartments.FieldByName('letter').AsInteger,
          FApartments.FieldByName('privilege').AsInteger,
          FApartments.FieldByName('exempt').AsInteger,
          FApartments.FieldByName('half_paid').AsInteger,
          FApartments.FieldByName('locked').AsInteger,
          FApartments.FieldByName('apartment_id').AsInteger]);
        DM.qryDeleteFromApartments.ExecSQL;
      end;
      FApartments.Next;
    until FApartments.EOF;
    // 30 Aug 2016
    if (FClearIndicationPayments) then begin
      DM.qryDeleteFromApartments.Close;
      DM.qryDeleteFromApartments.SQL.Text := Format('update apartments set paid=0, half_paid=0, paid_dt=NOW() where (paid=1 and card_id=%d)', [FLastCardID]);
      DM.qryDeleteFromApartments.ExecSQL;
      FClearIndicationPayments := not FClearIndicationPayments;
    end;
  end;
  //
  FApartments.Bookmark := BM;
  //FApartments.FreeBookmark(BM);
  FApartments.EnableControls;
  //
  if (AValue = 0) then
    ShowDebtors;
  //
  if not FDeleteApartments.IsEmpty then begin
    FDeleteApartments.First;
    repeat
      if FDeleteApartments.FieldByName('apartment_id').AsInteger > 0 then begin
        DM.qryDeleteFromApartments.Close;
        DM.qryDeleteFromApartments.SQL.Text := Format('delete from apartments where apartment_id = %d', [FDeleteApartments.FieldByName('apartment_id').AsInteger]);
        DM.qryDeleteFromApartments.ExecSQL;
      end;
      FDeleteApartments.Next;
    until FDeleteApartments.Eof;
    FDeleteApartments.Clear(False); // 04.12.2014 10:14:26
  end;

    // Переобновим список квартир
  FApartments.DisableControls;
  DM.qryRefApartments.Close;
  DM.qryRefApartments.ParamByName('card_id').AsInteger := FLastCardID;
  DM.qryRefApartments.Open;

  if FApartments.Active then begin
    FApartments.Clear(False);
    FApartments.Close;
  end;
  FApartments.Open;
  if not DM.qryRefApartments.IsEmpty then begin
    FApartments.First;
    repeat
      FApartments.Append;
      FApartments.FieldByName('apartment_id').AsInteger  := DM.qryRefApartments.FieldByName('apartment_id').AsInteger;
      FApartments.FieldByName('paid').AsInteger          := DM.qryRefApartments.FieldByName('paid').AsInteger;
      FApartments.FieldByName('number').AsInteger        := DM.qryRefApartments.FieldByName('number').AsInteger;
      FApartments.FieldByName('card_id').AsInteger       := DM.qryRefApartments.FieldByName('card_id').AsInteger;
      FApartments.FieldByName('privilege').AsInteger     := DM.qryRefApartments.FieldByName('privilege').AsInteger;
      FApartments.FieldByName('exempt').AsInteger        := DM.qryRefApartments.FieldByName('exempt').AsInteger;
      FApartments.FieldByName('letter').AsInteger        := DM.qryRefApartments.FieldByName('letter').AsInteger;
      FApartments.FieldByName('calc_letter').AsString    := EncodeApartmentLetter(DM.qryRefApartments.FieldByName('letter').AsInteger);
      FApartments.FieldByName('half_paid').AsInteger     := DM.qryRefApartments.FieldByName('half_paid').AsInteger;
      FApartments.FieldByName('locked').AsInteger        := DM.qryRefApartments.FieldByName('locked').AsInteger;
      if (not DM.qryRefApartments.FieldByName('paid_dt').IsNull) then
        FApartments.FieldByName('paid_dt').AsString      := DM.qryRefApartments.FieldByName('paid_dt').AsString;

      FApartments.Post;
      DM.qryRefApartments.Next;
    until DM.qryRefApartments.EOF;
    FApartments.First;
  end;

  FOldApartments.Clear;
  FOldApartments.CopyFromDataset(FApartments, True);

  FApartments.EnableControls;

  // 30 Aug 2016
  if (not grdApartments.Enabled) then
    grdApartments.Enabled := not grdApartments.Enabled;

  //FBackupCard := FCard;

  // Обновить данные
  fMain.grdCards.DataSource.DataSet.DisableControls;
  DM.qryCards.Close;
  DM.qryCards.Open;
  fMain.grdCards.DataSource.Dataset.Locate('card_id', FLastCardID, [loPartialKey]);
  fMain.grdCards.DataSource.DataSet.EnableControls;
  fMain.InfoRecordCount;

end;

// Паспортные данные или другой документ
function TfmNewCard.Passport(ID: Integer): string;
var
  qryClientInfo: TZReadOnlyQuery;
begin
  Result := '';
  try
    qryClientInfo := TZReadOnlyQuery.Create(nil);
    qryClientInfo.Connection := DM.DBConn;
    qryClientInfo.Close;
    qryClientInfo.SQL.Text := 'SELECT a.face_id, a.doc_type_id, a.series, a.number,a.issue_date, a.issue, a.phones, a.client_id,';
    qryClientInfo.SQL.Add('b.name AS doc_type_name, c.name AS client_name');
    qryClientInfo.SQL.Add('FROM faces a');
    qryClientInfo.SQL.Add('LEFT JOIN docs_types b ON b.doc_type_id = a.doc_type_id');
    qryClientInfo.SQL.Add('LEFT JOIN clients c ON c.client_id = a.client_id');
    qryClientInfo.SQL.Add(Format('WHERE a.client_id = %d', [ID]));
    qryClientInfo.Open;
    if (not qryClientInfo.IsEmpty) then begin
      if (qryClientInfo.FieldByName('doc_type_name').AsString <> '') then
        Result := qryClientInfo.FieldByName('doc_type_name').AsString;
      if (qryClientInfo.FieldByName('series').AsString <> '') then
        Result := Result + ' серия ' + qryClientInfo.FieldByName('series').AsString;
      if (qryClientInfo.FieldByName('number').AsString <> '') then
        Result := Result + ' № ' + qryClientInfo.FieldByName('number').AsString;
      if (qryClientInfo.FieldByName('issue_date').AsString <> '') then
        Result := Result + ' выдан ' + FormatDateTime('dd.mm.yyyy', StrToDate(qryClientInfo.FieldByName('issue_date').AsString));
      if (qryClientInfo.FieldByname('issue').AsString <> '') then
        Result := Result + ' ' + qryClientInfo.FieldByName('issue').AsString;
    end;
  finally
    qryClientInfo.Free;
  end;
end;

function TfmNewCard.Residence(ID: Integer; ResidenceType: Integer): string;
var
  qryClient: TZReadOnlyQuery;
begin
  (*
  SELECT
  b.name AS city_name, CONCAT(c.name, ' ', d.short_name) AS street_name, e.number AS house_number, a.room_apartment
  FROM residence_clients a
  LEFT JOIN cities b ON b.city_id = a.city_id
  LEFT JOIN streets c ON c.street_id = a.street_id
  INNER JOIN street_types d ON d.street_type_id = c.street_type_id
  LEFT JOIN houses e ON e.house_id = a.house_id

  WHERE (a.client_id = 1775) AND (a.residence_type_id = 0)
  *)
  Result := '';
  try
    qryClient := TZReadOnlyQuery.Create(nil);
    qryClient.Connection := DM.DBConn;
    qryClient.Close;
    qryClient.SQL.Text := 'SELECT b.name AS city_name, CONCAT(c.name, '' '', d.short_name) AS street_name, e.number AS house_number, a.room_apartment';
    qryClient.SQL.Add('FROM residence_clients a');
    qryClient.SQL.Add('LEFT JOIN cities b ON b.city_id = a.city_id');
    qryClient.SQL.Add('LEFT JOIN streets c ON c.street_id = a.street_id');
    qryClient.SQL.Add('INNER JOIN street_types d ON d.street_type_id = c.street_type_id');
    qryClient.SQL.Add('LEFT JOIN houses e ON e.house_id = a.house_id');
    qryClient.SQL.Add(Format('WHERE (a.client_id = %d) AND (a.residence_type_id = %d)', [ID, ResidenceType]));
    qryClient.Open;
    if (not qryClient.IsEmpty) then begin
      if Trim(qryClient.FieldByName('city_name').AsString) <> '' then
        Result := 'Город: ' + Trim(qryClient.FieldByName('city_name').AsString);
      if Trim(qryClient.FieldByName('street_name').AsString) <> '' then
        Result := Result + ', улица: ' + Trim(qryClient.FieldByName('street_name').AsString);
      if Trim(qryClient.FieldByName('house_number').AsString) <> '' then
        Result := Result + ', дом: ' + Trim(qryClient.FieldByName('house_number').AsString);
      if Trim(qryClient.FieldByName('room_apartment').AsString) <> '' then begin
        if Trim(Result) <> '' then
          Result := Result + ', кв: ' + Trim(qryClient.FieldByName('room_apartment').AsString)
        else
          Result := 'кв: ' + Trim(qryClient.FieldByName('room_apartment').AsString);
      end;
    end;
  finally
    qryClient.Free;
  end;
end;

function TfmNewCard.GetPhones(ID: Integer): string;
var
  qryClient: TZReadOnlyQuery;
begin
  Result := '';
    try
      qryClient := TZReadOnlyQuery.Create(nil);
      qryClient.Connection := DM.DBConn;
      qryClient.Close;
      qryClient.SQL.Text := 'SELECT a.phones';
      qryClient.SQL.Add('FROM faces a');
      qryClient.SQL.Add(Format('WHERE a.client_id = %d', [ID]));
      qryClient.Open;
      if (not qryClient.IsEmpty) then begin
        Result := Trim(qryClient.FieldByName('phones').AsString);
      end;
    finally
      qryClient.Free;
    end;
end;

procedure TfmNewCard.ShowDebtors;
var
  I, TotalDebtors, TotalPrivileges, TotalExempts, TotalLockeds, lengthBlue: Integer;
  BM: TBookmark;
  RoomApartments, PrivilegeApartments, ExcemptApartments, LockApartments: AnsiString;
  S, ListOfApartments, LastApartment: AnsiString;
  IsNormal: Boolean;

  procedure AddColorStr(s: AnsiString; const col: TColor = clBlack; const NewLine: boolean = true);
      begin
        with memoShowDebtors do
        begin
          if NewLine then
          begin
            Lines.Add('');
            Lines.Delete(Lines.Count - 1); // avoid double line spacing
          end;

          SelStart  := Length(Text);
          SelText   := s;
          SelLength := Length(s);
          SetRangeColor(SelStart, SelLength, col);

          // deselect inserted string and position cursor at the end of the text
          SelStart  := Length(Text);
          SelText   := '';
        end;
      end;
begin

  try
    if (FCard.CardID > 0) and (dtStartService.Text <> '') and (dtEndService.Text <> '') then begin
      FQryCountOfFines.Close;
      FQryCountOfFines.SQL.Text := ' SELECT b.`number`, b.letter, b.paid FROM fines a';
      FQryCountOfFines.SQL.Append(' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id');
      FQryCountOfFines.SQL.Append(' LEFT JOIN cards c ON c.card_id = b.card_id');
      FQryCountOfFines.SQL.Append(' WHERE');
      FQryCountOfFines.SQL.Append(Format(' (c.contract_number = %d)', [FCard.ContractNumber]));
      FQryCountOfFines.SQL.Append(' AND');
      FQryCountOfFines.SQL.Append(Format(' (DATE(a.create_dt) BETWEEN ''%s'' AND ''%s'')', [FormatDateTime('yyyy-mm-dd', dtStartService.Date), FormatDateTime('yyyy-mm-dd', dtEndService.Date)]));
      FQryCountOfFines.SQL.Append(' ORDER BY');
      FQryCountOfFines.SQL.Append(' b.`number`, b.letter');
      //FQryCountOfFines.SQL.SaveToFile('d:\fines.sql');
      FQryCountOfFines.Open;
      IsNormal := True;
    end;
  except
    isNormal := False;
  end;

  memoShowDebtors.Lines.BeginUpdate;
  memoShowDebtors.Clear;

  if DM.qryRefApartments.IsEmpty then
    memoShowDebtors.Text := ''
  else begin
    //GetMem(BM, SizeOf(BM));
    BM := grdApartments.DataSource.Dataset.Bookmark;
    grdApartments.DataSource.Dataset.DisableControls;

    TotalDebtors := 0; TotalPrivileges := 0; TotalExempts := 0; TotalLockeds := 0;
    RoomApartments := '';
    PrivilegeApartments := '';
    ExcemptApartments := '';
    LockApartments := '';
    if not grdApartments.DataSource.DataSet.IsEmpty then begin
      grdApartments.DataSource.Dataset.First;
      repeat
        if (grdApartments.DataSource.DataSet.FieldByName('paid').AsInteger = 0) and (grdApartments.DataSource.DataSet.FieldByName('exempt').AsInteger = 0) then begin
          Inc(TotalDebtors);
          RoomApartments := RoomApartments + Trim(grdApartments.DataSource.DataSet.FieldByName('number').AsString) + Trim(grdApartments.DataSource.DataSet.FieldByName('calc_letter').AsString) +  ', ';
        end;
        if grdApartments.DataSource.DataSet.FieldByName('privilege').AsInteger = 1 then begin
          Inc(TotalPrivileges);
          PrivilegeApartments := PrivilegeApartments + Trim(grdApartments.DataSource.DataSet.FieldByName('number').AsString) + Trim(grdApartments.DataSource.DataSet.FieldByName('calc_letter').AsString) +  ', ';
        end;
        if grdApartments.DataSource.DataSet.FieldByName('exempt').AsInteger = 1 then begin
          Inc(TotalExempts);
          ExcemptApartments := ExcemptApartments + Trim(grdApartments.DataSource.DataSet.FieldByName('number').AsString) + Trim(grdApartments.DataSource.DataSet.FieldByName('calc_letter').AsString) +  ', ';
        end;
        if grdApartments.DataSource.DataSet.FieldByName('locked').AsInteger = 1 then begin
          Inc(TotalLockeds);
          LockApartments := LockApartments + Trim(grdApartments.DataSource.DataSet.FieldByName('number').AsString) + Trim(grdApartments.DataSource.DataSet.FieldByName('calc_letter').AsString) +  ', ';
        end;
        grdApartments.DataSource.DataSet.Next;
      until grdApartments.DataSource.DataSet.Eof;
    end;

    S := Format('Всего квартир: %d, должников: %d', [grdApartments.DataSource.DataSet.RecordCount, TotalDebtors]);
    if TotalDebtors > 0 then begin
      RoomApartments := Trim(RoomApartments);
      if (Length(RoomApartments) > 1) and (RightStr(RoomApartments, 1) = ',') then
        RoomApartments := Copy(RoomApartments, 1, Length(RoomApartments) - 1);
      if Length(RoomApartments) > 0 then
        S := S + ', номера квартир: ' + RoomApartments;
    end;
    AddColorStr(S, clBlue, True);
    if (TotalPrivileges > 0) then begin
      PrivilegeApartments := Trim(PrivilegeApartments);
      if (Length(PrivilegeApartments) > 1) and (RightStr(PrivilegeApartments, 1) = ',') then
        PrivilegeApartments := Copy(PrivilegeApartments, 1, Length(PrivilegeApartments) - 1);
      if Length(PrivilegeApartments) > 0 then
        PrivilegeApartments := ', номера квартир: ' + PrivilegeApartments;
      S := Format('Льготников: %d%s', [TotalPrivileges, PrivilegeApartments]);
      AddColorStr(S, clFuchsia, True);
    end;
    if (TotalExempts > 0) then begin
      ExcemptApartments := Trim(ExcemptApartments);
      if (Length(ExcemptApartments) > 1) and (RightStr(ExcemptApartments, 1) = ',') then
        ExcemptApartments := Copy(ExcemptApartments, 1, Length(ExcemptApartments) - 1);
      if Length(ExcemptApartments) > 0 then
        ExcemptApartments := ', номера квартир: ' + ExcemptApartments;
      S := Format('Освобождено от платы: %d%s', [TotalExempts, ExcemptApartments]);
      AddColorStr(S, clGreen, True);
    end;
    if (TotalLockeds > 0) then begin
      LockApartments := Trim(LockApartments);
      if (Length(LockApartments) > 1) and (RightStr(LockApartments, 1) = ',') then
        LockApartments := Copy(LockApartments, 1, Length(LockApartments) - 1);
      if Length(LockApartments) > 0 then
        LockApartments := ', номера квартир: ' + LockApartments;
      S := Format('Заблокировано: %d%s', [TotalLockeds, LockApartments]);
      AddColorStr(S, clRed, True);
    end;

    if ((IsNormal) and (not FQryCountOfFines.IsEmpty)) then begin
      ListOfApartments := '';
      LastApartment := '';
      FQryCountOfFines.First;
      repeat
        S := FQryCountOfFines.FieldByName('number').AsString + EncodeApartmentLetter(FQryCountOfFines.FieldByName('letter').AsInteger);
        if (LastApartment <> S) then begin
          if (ListOfApartments = '') then begin
            ListOfApartments := S;
          end
          else begin
            ListOfApartments := ListOfApartments + ', ' + S;
          end;
          LastApartment := S;
        end;
        FQryCountOfFines.Next;
      until FQryCountOfFines.Eof;

      AddColorStr(Format('Подключений: %d, номера квартир: %s', [FQryCountOfFines.RecordCount, ListOfApartments]), clMaroon);
    end;

    memoShowDebtors.SelStart := 0;
    memoShowDebtors.SelLength := 0;

    grdApartments.DataSource.DataSet.Bookmark := BM;
    //grdApartments.DataSource.DataSet.FreeBookmark(BM);
    grdApartments.DataSource.Dataset.EnableControls;

    //FreeMem(BM);
    //BM := nil;
  end;

  memoShowDebtors.Lines.EndUpdate;

end;

function TfmNewCard.ClearEquipment: Boolean;
var
  I, LastItemIndex: Integer;
begin
  Result := False;
  LastItemIndex := cbEquipment.ItemIndex;
  cbEquipment.Items.BeginUpdate;
  for I := 0 to cbEquipment.Items.Count do begin
      if (Integer(cbEquipment.Items.Objects[I]) = 0) then begin
        Result := not Result;
        break;
      end;
  end;
  if (Result) then begin
    cbEquipment.ItemIndex := I;
    FCard.EquipmentID := 0;
  end;
  cbEquipment.Items.EndUpdate;
end;

function TfmNewCard.ClearCity: Boolean;
var
  I, LastItemIndex: Integer;
begin
  Result := False;
  LastItemIndex := cbCities.ItemIndex;
  cbCities.Items.BeginUpdate;
  for I := 0 to cbCities.Items.Count do begin
      if (Integer(cbCities.Items.Objects[I]) = 0) then begin
        Result := not Result;
        break;
      end;
  end;
  if (Result) then begin
    cbCities.ItemIndex := I;
    FCard.CityID := 0;
    ClearStreet;
    ClearHouse;
  end;
  cbCities.Items.EndUpdate;
end;

function TfmNewCard.ClearStreet: Boolean;
var
  I, LastItemIndex: Integer;
begin
  Result := False;
  LastItemIndex := cbStreets.ItemIndex;
  cbStreets.Items.BeginUpdate;
  for I := 0 to cbStreets.Items.Count do begin
      if (Integer(cbStreets.Items.Objects[I]) = 0) then begin
        Result := not Result;
        break;
      end;
  end;
  if (Result) then begin
    cbStreets.ItemIndex := I;
    FCard.StreetID := 0;
  end;
  cbStreets.Items.EndUpdate;
end;

function TfmNewCard.ClearHouse: Boolean;
var
  I, LastItemIndex: Integer;
begin
  Result := False;
  LastItemIndex := cbHouses.ItemIndex;
  cbHouses.Items.BeginUpdate;
  for I := 0 to cbHouses.Items.Count do begin
      if (Integer(cbHouses.Items.Objects[I]) = 0) then begin
        Result := not Result;
        break;
      end;
  end;
  if (Result) then begin
    cbHouses.ItemIndex := I;
    FCard.HouseID := 0;
  end;
  cbHouses.Items.EndUpdate;
end;

function TfmNewCard.ClearBrigade: Boolean;
var
  I, LastItemIndex: Integer;
begin
  Result := False;
  LastItemIndex := cbBrigade.ItemIndex;
  cbBrigade.Items.BeginUpdate;
  for I := 0 to cbBrigade.Items.Count do begin
      if (Integer(cbBrigade.Items.Objects[I]) = 0) then begin
        Result := not Result;
        break;
      end;
  end;
  if (Result) then begin
    cbBrigade.ItemIndex := I;
    FCard.BrigadeID := 0;
  end;
  cbBrigade.Items.EndUpdate;
end;

function TfmNewCard.ClearMounting: Boolean;
var
  I, LastItemIndex: Integer;
begin
  Result := False;
  LastItemIndex := cbMounting.ItemIndex;
  cbMounting.Items.BeginUpdate;
  for I := 0 to cbMounting.Items.Count do begin
      if (Integer(cbMounting.Items.Objects[I]) = 0) then begin
        Result := not Result;
        break;
      end;
  end;
  if (Result) then begin
    cbMounting.ItemIndex := I;
    FCard.Mounting := 0;
  end;
  cbMounting.Items.EndUpdate;

end;

procedure TfmNewCard.ChangeClientEx(IsEdit: Boolean; ID: Integer; ATag: Integer
  );
var
  IsBadDate: Boolean;
  V: Variant;
  FaceID: Integer;
  RefFacesExIsEmpty: Boolean;
  RefResidence1ExIsEmpty: Boolean;
  RefResidence2ExIsEmpty: Boolean;
begin
  IsBadDate := False;

  // qryClientsEx
  DM.qryClientsEx.Close;
  DM.qryClientsEx.Params.ParamByName('client_id').AsInteger := ID;
  DM.qryClientsEx.Open;
  if DM.qryClientsEx.IsEmpty then
    DM.qryClientsEx.Append
  else
    DM.qryClientsEx.Edit;

  // qryRefFacesEx
  DM.qryRefFacesEx.Close;
  DM.qryRefFacesEx.Params.ParamByName('client_id').AsInteger := ID;
  DM.qryRefFacesEx.Open;

  RefFacesExIsEmpty := DM.qryRefFacesEx.IsEmpty;
  if RefFacesExIsEmpty then
    DM.qryRefFacesEx.Append
  else
    DM.qryRefFacesEx.Edit;

  // qryRefResidence1Ex
  DM.qryRefResidence1Ex.Close;
  DM.qryRefResidence1Ex.Params.ParamByName('client_id').AsInteger := ID;
  DM.qryRefResidence1Ex.Open;

  RefResidence1ExIsEmpty := DM.qryRefResidence1Ex.IsEmpty;
  if RefResidence1ExIsEmpty then
    DM.qryRefResidence1Ex.Append
  else
    DM.qryRefResidence1Ex.Edit;

  // qryRefResidence2Ex
  DM.qryRefResidence2Ex.Close;
  DM.qryRefResidence2Ex.Params.ParamByName('client_id').AsInteger := ID;
  DM.qryRefResidence2Ex.Open;

  RefResidence2ExIsEmpty := DM.qryRefResidence2Ex.IsEmpty;
  if RefResidence2ExIsEmpty then
    DM.qryRefResidence2Ex.Append
  else
    DM.qryRefResidence2Ex.Edit;

  with TfmClientEx.Create(Application) do begin

    if RefResidence1ExIsEmpty then begin
      lcbCity1.KeyValue := 0;

      DM.qryRefStreetsEx1.Close;
      DM.qryRefStreetsEx1.ParamByName('city_id').AsInteger := 0;
      DM.qryRefStreetsEx1.Open;
      lcbStreet1.KeyValue := 0;

      DM.qryRefHousesEx1.Close;
      DM.qryRefHousesEx1.ParamByName('street_id').AsInteger := 0;
      DM.qryRefHousesEx1.Open;
      lcbHouse1.KeyValue := 0;
      lcbHouse1.Text := '';
    end
    else begin
      //ShowMessage(DM.qryRefResidence1Ex.FieldByName('city_id').AsString);
      lcbCity1.KeyValue := DM.qryRefResidence1Ex.FieldByName('city_id').AsInteger;

      DM.qryRefStreetsEx1.Close;
      DM.qryRefStreetsEx1.ParamByName('city_id').AsInteger := DM.qryRefResidence1Ex.FieldByName('city_id').AsInteger;
      DM.qryRefStreetsEx1.Open;
      DM.qryRefStreetsEx1.Locate('city_id', DM.qryRefResidence1Ex.FieldByName('city_id').AsInteger, []);

      lcbStreet1.KeyValue := DM.qryRefResidence1Ex.FieldByName('street_id').AsInteger;;

      DM.qryRefHousesEx1.Close;
      DM.qryRefHousesEx1.ParamByName('street_id').AsInteger := DM.qryRefResidence1Ex.FieldByName('street_id').AsInteger;
      DM.qryRefHousesEx1.Open;
      DM.qryRefHousesEx1.Locate('street_id', DM.qryRefResidence1Ex.FieldByName('street_id').AsInteger, []);

      lcbHouse1.KeyValue := DM.qryRefResidence1Ex.FieldByName('house_id').AsInteger;;
    end;

    if RefResidence2ExIsEmpty then begin
      lcbCity2.KeyValue := 0;

      DM.qryRefStreetsEx2.Close;
      DM.qryRefStreetsEx2.ParamByName('city_id').AsInteger := 0;
      DM.qryRefStreetsEx2.Open;
      lcbStreet2.KeyValue := 0;

      DM.qryRefHousesEx2.Close;
      DM.qryRefHousesEx2.ParamByName('street_id').AsInteger := 0;
      DM.qryRefHousesEx2.Open;
      lcbHouse2.KeyValue := 0;
      lcbHouse2.Text := '';
    end
    else begin
      lcbCity2.KeyValue := DM.qryRefResidence2Ex.FieldByName('city_id').AsInteger;

      DM.qryRefStreetsEx2.Close;
      DM.qryRefStreetsEx2.ParamByName('city_id').AsInteger := DM.qryRefResidence2Ex.FieldByName('city_id').AsInteger;
      DM.qryRefStreetsEx2.Open;
      DM.qryRefStreetsEx2.Locate('city_id', DM.qryRefResidence2Ex.FieldByName('city_id').AsInteger, []);

      lcbStreet2.KeyValue := DM.qryRefResidence2Ex.FieldByName('street_id').AsInteger;;

      DM.qryRefHousesEx2.Close;
      DM.qryRefHousesEx2.ParamByName('street_id').AsInteger := DM.qryRefResidence2Ex.FieldByName('street_id').AsInteger;
      DM.qryRefHousesEx2.Open;
      DM.qryRefHousesEx2.Locate('street_id', DM.qryRefResidence2Ex.FieldByName('street_id').AsInteger, []);

      lcbHouse2.KeyValue := DM.qryRefResidence2Ex.FieldByName('house_id').AsInteger;;
    end;

    IsBadDate := DM.qryRefFacesEx.FieldByName('issue_date').AsString = '00.00.0000';
    if not IsBadDate then
      IsBadDate := Trim(DM.qryRefFacesEx.FieldByName('issue_date').AsString) = '';

    if not IsBadDate then
      dtIssue.Date := DM.qryRefFacesEx.FieldByName('issue_date').AsDateTime;

    //-----------------------------------------------------------------------------

    if ShowModal = mrOK then begin
      //DM.qryClientsEx.FieldByName('name').AsString := edName.Text;
      DM.qryClientsEx.Post;

      // Новая запись, получим ID клиента, внесем изменения
      if not IsEdit then begin
        DM.qryLastClientID.Close;
        DM.qryLastClientID.Open;
        ID := DM.qryLastClientID.FieldByName('last_client_id').AsInteger;
      end;

      DM.qryClients.Refresh;

      // doc_type_id
      if VarIsNull(lcbDocument.KeyValue) then
        DM.qryRefFacesEx.FieldByName('doc_type_id').Value := Null
      else
        DM.qryRefFacesEx.FieldByName('doc_type_id').AsInteger := lcbDocument.KeyValue;
      // series
      if Trim(edSeries.Text) = '' then
        DM.qryRefFacesEx.FieldByName('series').Value := null
      else
        DM.qryRefFacesEx.FieldByName('series').AsString := Trim(edSeries.Text);
      // number
      if Trim(edNumber.Text) = '' then
        DM.qryRefFacesEx.FieldByName('number').Value := null
      else
        DM.qryRefFacesEx.FieldByName('number').AsString := Trim(edNumber.Text);
      // issue_date
      if Trim(dtIssue.Text) = '' then
        DM.qryRefFacesEx.FieldByName('issue_date').Value := null
      else
        DM.qryRefFacesEx.FieldByName('issue_date').AsString := FormatDateTime('yyyy-mm-dd', dtIssue.Date);
      // issue
      if Trim(edIssue.Text) = '' then
        DM.qryRefFacesEx.FieldByName('issue').Value := null
      else
        DM.qryRefFacesEx.FieldByName('issue').AsString := Trim(edIssue.Text);
      // phones
      if Trim(edClientPhones.Text) = '' then
        DM.qryRefFacesEx.FieldByName('phones').Value := null
      else
        DM.qryRefFacesEx.FieldByName('phones').AsString := Trim(edClientPhones.Text);

      if RefFacesExIsEmpty then begin
        DM.qryRefFacesEx.FieldByName('client_id').AsInteger := ID;
      end;

      DM.qryRefFacesEx.Post;

      // RefResidence1Ex
      if VarIsNull(lcbCity1.KeyValue) then
        DM.qryRefResidence1Ex.FieldByName('city_id').Value := 0
      else
        DM.qryRefResidence1Ex.FieldByName('city_id').AsInteger := Integer(lcbCity1.KeyValue);
      if VarIsNull(lcbStreet1.KeyValue) then
        DM.qryRefResidence1Ex.FieldByName('street_id').Value := 0
      else
        DM.qryRefResidence1Ex.FieldByName('street_id').AsInteger := Integer(lcbStreet1.KeyValue);
      if VarIsNull(lcbHouse1.KeyValue) then
        DM.qryRefResidence1Ex.FieldByName('house_id').Value := 0
      else
        DM.qryRefResidence1Ex.FieldByName('house_id').AsInteger := Integer(lcbHouse1.KeyValue);
      if Trim(edApartment1.Text) = '' then
        DM.qryRefResidence1Ex.FieldByName('room_apartment').Value := Null
      else
        DM.qryRefResidence1Ex.FieldByName('room_apartment').AsString := Trim(edApartment1.Text);

      if RefResidence1ExIsEmpty then begin
        DM.qryRefResidence1Ex.FieldByName('client_id').AsInteger := ID;
      end;
      DM.qryRefResidence1Ex.Post;

      // RefResidence2Ex
      if VarIsNull(lcbCity2.KeyValue) then
        DM.qryRefResidence2Ex.FieldByName('city_id').Value := 0
      else
        DM.qryRefResidence2Ex.FieldByName('city_id').AsInteger := Integer(lcbCity2.KeyValue);
      if VarIsNull(lcbStreet2.KeyValue) then
        DM.qryRefResidence2Ex.FieldByName('street_id').Value := 0
      else
        DM.qryRefResidence2Ex.FieldByName('street_id').AsInteger := Integer(lcbStreet2.KeyValue);
      if VarIsNull(lcbHouse2.KeyValue) then
        DM.qryRefResidence2Ex.FieldByName('house_id').Value := 0
      else
        DM.qryRefResidence2Ex.FieldByName('house_id').AsInteger := Integer(lcbHouse2.KeyValue);
      if Trim(edApartment2.Text) = '' then
        DM.qryRefResidence2Ex.FieldByName('room_apartment').Value := Null
      else
        DM.qryRefResidence2Ex.FieldByName('room_apartment').AsString := Trim(edApartment2.Text);

      if RefResidence2ExIsEmpty then begin
        DM.qryRefResidence2Ex.FieldByName('client_id').AsInteger := ID;
      end;
      DM.qryRefResidence2Ex.Post;

      if ATag in [0..1] then begin
        FCard.ClientID := ID;
        ShowClientInfo(FCard.ClientID);
      end
      else begin
        FCard.MClientID := ID;
        ShowMClientInfo(FCard.MClientID);
      end;

      if ATag in [0..3] then begin
        addClients(FCard.ClientID);
        addMClients(FCard.MClientID);
      end;

    end
    else begin
      DM.qryClientsEx.Cancel;
      DM.qryRefFacesEx.Cancel;
      DM.qryRefResidence1Ex.Cancel;
      DM.qryRefResidence2Ex.Cancel;
    end;
    Free;
  end;
end;

procedure TfmNewCard.ShowClientInfo(ID: Integer);
begin
  lbClientIdentityCard.Caption := Passport(ID);
  lbClientRegistration.Caption := Residence(ID, 0);
  lbClientActualResidence.Caption := Residence(ID, 1);
  edClientPhones.Text := GetPhones(ID);
end;

procedure TfmNewCard.ShowMClientInfo(ID: Integer);
begin
  lbMClientIdentityCard.Caption := Passport(ID);
  lbMClientRegistration.Caption := Residence(ID, 0);
  lbMClientActualResidence.Caption := Residence(ID, 1);
  edMClientPhones.Text := GetPhones(ID);
end;

procedure TfmNewCard.ShowHistory;
begin
  if (frmPaymentsHistory <> nil) then begin
    frmPaymentsHistory.lbPaymentsCount.Caption := Format('Всего оплат: %d', [0]);
    frmPaymentsHistory.lbFinesCount.Caption := Format('Всего подключений: %d', [0]);
  end;

  if Assigned(FApartments) then begin
    if (not FApartments.IsEmpty) and (FApartments.Active) and (FApartments.FieldByName('apartment_id').AsInteger <> 0) then begin
      DM.qryPaymentsHistory.Close;
      DM.qryPaymentsHistory.Params.ParamByName('apartment_id').AsInteger := FApartments.FieldByName('apartment_id').AsInteger;
      DM.qryPaymentsHistory.Open;

      DM.qryFinesHistory.Close;
      DM.qryFinesHistory.Params.ParamByName('apartment_id').AsInteger := FApartments.FieldByName('apartment_id').AsInteger;
      DM.qryFinesHistory.Open;

      DM.qryCardHistory.Close;
      DM.qryCardHistory.Params.ParamByName('card_id').AsInteger := FCard.CardID;
      DM.qryCardHistory.Open;

      if Assigned(frmPaymentsHistory) then begin
        frmPaymentsHistory.lbPaymentsCount.Caption := Format('Всего оплат: %d', [DM.qryPaymentsHistory.RecordCount]);
        frmPaymentsHistory.lbFinesCount.Caption := Format('Всего подключений: %d', [DM.qryFinesHistory.RecordCount]);
      end;
    end
  end;
end;

procedure TfmNewCard.ClearPayments;
var
  I, TotalDebtors, TotalPrivileges, TotalExempts, TotalLockeds: Integer;
  BM: TBookmark;
  RoomApartments: string;
  IsExistsPayment: Boolean;
  Total: Integer;
begin
  //if not grdApartments.DataSource.DataSet.IsEmpty then begin
  //
  //  BM := grdApartments.DataSource.Dataset.GetBookmark;
  //  grdApartments.DataSource.Dataset.DisableControls;
  //
  //  grdApartments.DataSource.Dataset.First;
  //  repeat
  //    if grdApartments.DataSource.DataSet.FieldByName('paid').AsInteger <> 0 then begin
  //      grdApartments.DataSource.DataSet.Edit;
  //      grdApartments.DataSource.DataSet.FieldByName('paid').AsInteger := 0;
  //      grdApartments.DataSource.DataSet.FieldByName('half_paid').AsInteger := 0;
  //      grdApartments.DataSource.DataSet.Post;
  //    end;
  //
  //    grdApartments.DataSource.DataSet.Next;
  //  until grdApartments.DataSource.DataSet.Eof;
  //
  //  grdApartments.DataSource.DataSet.GotoBookmark(BM);
  //
  //  if Assigned(BM) then
  //    grdApartments.DataSource.DataSet.FreeBookmark(BM);
  //  grdApartments.DataSource.Dataset.EnableControls;
  //end;

  IsExistsPayment := False;
  Total := 0;
  if (FApartments <> Nil) then begin
    if FApartments.RecordCount > 0 then begin
      //GetMem(BM, SizeOf(BM));
      BM := FApartments.Bookmark;
      FApartments.DisableControls;

      FApartments.First;
      repeat
        if (FApartments.FieldByName('paid').AsInteger = 1) then begin
          FApartments.Edit;
          FApartments.FieldByName('paid').AsInteger := 0;
          FApartments.FieldByName('half_paid').AsInteger := 0;
          FApartments.Post;
          IsExistsPayment := True;
          Inc(Total);
        end;
        FApartments.Next;
      until FApartments.Eof;

      FApartments.Bookmark := BM;
      //FApartments.FreeBookmark(BM);
      FApartments.EnableControls;

      if (IsExistsPayment) then begin
        grdApartments.Enabled := False;
        FClearIndicationPayments := IsExistsPayment;
      end;

      Application.MessageBox(PChar(Format('Сброшено платежей: %d', [Total])), 'Информация', MB_ICONINFORMATION + IDOK);

    end;
  end;

end;

procedure TfmNewCard.myApartmentsDataChange(Sender: TObject; Field: TField);
begin
  ShowHistory;
end;

procedure TfmNewCard.Sort;
var
  I, J, X, Number, Letter: Integer;
  Temp: TMemDataset;
  IsFound: Boolean;
  ModifyRecno: Integer;
begin
  if FApartments.RecordCount > 1 then begin
    try
      Temp := TMemDataset.Create(nil);
      Temp.CopyFromDataset(FApartments, False);
      if not Temp.Active then
        Temp.Open;

      FApartments.DisableControls;
      repeat
        FApartments.First;
        Number := FApartments.FieldByName('number').AsInteger;
        Letter := FApartments.FieldByName('letter').AsInteger;
        IsFound := False;
        repeat
          if (FApartments.FieldByName('number').AsInteger < Number) or ((FApartments.FieldByName('number').AsInteger = Number) and (FApartments.FieldByName('letter').AsInteger < Letter)) then begin
            IsFound := True;
            Number := FApartments.FieldByName('number').AsInteger;
            Letter := FApartments.FieldByName('letter').AsInteger;
            ModifyRecno := FApartments.RecNo;
          end;
          FApartments.Next;
        until FApartments.Eof;
        //
        if IsFound then
          FApartments.RecNo := ModifyRecno
        else
          FApartments.RecNo := 1;

        Temp.Append;
        for I := 0 to Temp.FieldDefs.Count - 1 do
          Temp.Fields[I].Value := FApartments.Fields[I].Value;
        Temp.Post;
        FApartments.Delete;
        //
      until FApartments.RecordCount = 1;
      Temp.Append;
      for I := 0 to Temp.FieldDefs.Count - 1 do
        Temp.Fields[I].Value := FApartments.Fields[I].Value;
      Temp.Post;
      FApartments.Clear(False);

      Temp.First;
      repeat
        FApartments.Append;
        for I := 0 to FApartments.FieldDefs.Count - 1 do
          FApartments.Fields[I].Value := Temp.Fields[I].Value;
        FApartments.Post;
        Temp.Next;
      until Temp.Eof;
      if not FApartments.IsEmpty then
        FApartments.First;

      FApartments.EnableControls;
    finally
      Temp.Free;
    end;
  end;
end;

function TfmNewCard.Checked: Boolean;
var
  ProlongedContractIsExists: Boolean;
  qryCheckedParent: TZReadOnlyQuery;
  CheckedCityID: Integer;
  CheckedStreetID: Integer;
  S: string;

  OriginalContractNumber, VerifyContract: Integer;
  qryText: TZReadOnlyQuery;
  IsDuplicates: Boolean;

procedure ActivatePageIndex();
begin
  if pcCard.ActivePageIndex <> 0 then
    pcCard.ActivePageIndex := 0;
end;

begin
  Result := False;
  ProlongedContractIsExists := False;
  CheckedCityID := 0;
  CheckedStreetID := 0;

  //if not IsCheckedCode(edCardId.Text, 0) then begin
  //  edCardId.SetFocus;
  //  Application.MessageBox('Неверный номер договора или такой договор уже существует!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
  //  Exit;
  //end;

  if not IsCheckedCode(edCardId.Text) then begin
    ActivatePageIndex;
    edCardId.SetFocus;
    Application.MessageBox('Пустой договор или такой договор уже существует!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;

  if not IsValidDate(dtCreateDate.Date) then begin
    ActivatePageIndex;
    dtCreateDate.SetFocus;
    Application.MessageBox('Введите дату договора!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;
  if (FCard.EquipmentID = 0) then begin
    ActivatePageIndex;
    cbEquipment.SetFocus;
    Application.MessageBox('Не выбрано оборудование!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;
  if not IsValidDate(dtCreditTo.Date) then begin
    ActivatePageIndex;
    dtCreditTo.SetFocus;
    Application.MessageBox('Введите дату кредита до!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;
  if (FCard.CityID = 0) then begin
    ActivatePageIndex;
    cbCities.SetFocus;
    Application.MessageBox('Не выбран город!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;
  if (FCard.StreetID = 0) then begin
    ActivatePageIndex;
    cbStreets.SetFocus;
    Application.MessageBox('Не выбрана улица!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;
  if (FCard.HouseID = 0) then begin
    ActivatePageIndex;
    cbHouses.SetFocus;
    Application.MessageBox('Не выбран дом!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;

  if (cbMaintenanceContract.ItemIndex > 0) then begin
    S := Trim(edContractNumber.Text);
    //ShowMessage(IntToStr(Length(S)));
    if (S = '') then begin
      pcCard.ActivePageIndex := 2;
      edContractNumber.SetFocus;
      Application.MessageBox('Не указан номер договора техобслуживания!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    end;
  end;

  // 24.12.2014 8:47:10
  if Length(Trim(edContractNumber.Text)) > 0 then begin
    if (CompareStr(Trim(edContractNumber.Text), Trim(edCardID.Text))<> 0) then begin
      DM.qryProlongedContractIsExists.Close;
      DM.qryProlongedContractIsExists.Params.ParamByName('m_contract_number').AsString := Trim(edContractNumber.Text);
      DM.qryProlongedContractIsExists.Open;

      if (FCard.CardID = 0) then begin
        ProlongedContractIsExists := not DM.qryProlongedContractIsExists.IsEmpty;
      end
      else begin
        if not DM.qryProlongedContractIsExists.IsEmpty then
          ProlongedContractIsExists := FOldProlongedContract <> Trim(DM.qryProlongedContractIsExists.FieldByName('m_contract_number').AsString);
      end;

      // 15.01.2019
      // Временно отколючил
      //if ProlongedContractIsExists then begin
      //  //if pcCard.ActivePageIndex <> 2 then
      //  //  pcCard.ActivePageIndex := 2;
      //  //edContractNumber.SetFocus;
      //  Application.MessageBox(PChar(Format('Пролонгированный договор № %s уже существует в договоре № %d!', [Trim(edContractNumber.Text), DM.qryProlongedContractIsExists.FieldByName('contract_number').AsInteger])), 'Внимание', MB_ICONEXCLAMATION + MB_OK);
      //  //Exit;
      //end;
    end;
  end;

  if not IsNumeric(edPorch.Text) then begin
    ActivatePageIndex;
    edPorch.SetFocus;
    Application.MessageBox('Номер подъезда не является числом!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;
  if Trim(edNumeration.Text) = '' then begin
    ActivatePageIndex;
    edNumeration.SetFocus;
    Application.MessageBox('Не указана нумерация!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;

  // 16 May 2016
  qryCheckedParent := TZReadOnlyQuery.Create(nil);
  qryCheckedParent.Connection := DM.DBConn;
  qryCheckedParent.Close;

  if (FCard.CityID > 0) then begin
    qryCheckedParent.SQL.Text := Format('SELECT city_id FROM streets where street_id=%d', [FCard.StreetID]);
    qryCheckedParent.Open;
    if (not qryCheckedParent.IsEmpty) then begin
      CheckedCityID := qryCheckedParent.FieldByName('city_id').AsInteger;
    end;
  end;

  if (FCard.StreetID > 0) then begin
    qryCheckedParent.SQL.Text := Format('SELECT street_id FROM houses where house_id=%d', [FCard.HouseID]);
    qryCheckedParent.Open;
    if (not qryCheckedParent.IsEmpty) then begin
      CheckedStreetID := qryCheckedParent.FieldByName('street_id').AsInteger;
    end;
  end;

  qryCheckedParent.Free;

  if (FCard.CityID <> CheckedCityID) then begin
    ActivatePageIndex;
    cbStreets.SetFocus;
    Application.MessageBox('Улица не соответствует городу!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;

  if (FCard.StreetID <> CheckedStreetID) then begin
    ActivatePageIndex;
    cbHouses.SetFocus;
    Application.MessageBox('Дом не соответствует улице!', 'Внимание', MB_ICONEXCLAMATION + MB_OK);
    Exit;
  end;

  // 26.12.2018 12:16:16
  // Продублировано bnVerifyContractClick
  // 15.01.2019
  // Временно отколючил
  // Восстановил 27.03.2019

  if (Length(Trim(edContractNumber.Text)) > 0) then begin
    if (TryStrToInt(edContractNumber.Text, VerifyContract)) then begin
      if (VerifyContract = 0) then begin
        Application.MessageBox('Номер договора ТО должен быть больше 0 или пустым!', 'Предупреждение', MB_ICONWARNING + MB_OK);
        Exit;
      end;

      qryText := TZReadOnlyQuery.Create(nil);
      qryText.Connection := DM.DBConn;
      try
        qryText.Close;
        qryText.SQL.Text := 'SELECT a.contract_number, a.m_contract_number';
        qryText.SQL.Add('FROM cards a');
        qryText.SQL.Add(Format('WHERE (a.m_contract_number = %d)', [VerifyContract]));
        qryText.SQL.Add(Format('AND (a.maintenance_contract = %d)', [1]));
        qryText.Open;

        IsDuplicates := False;
        if (not qryText.IsEmpty) then begin
          repeat
            if (qryText.FieldByName('contract_number').AsInteger <> FCard.ContractNumber) then begin
              OriginalContractNumber := qryText.FieldByName('contract_number').AsInteger;
              IsDuplicates := True;
              Break;
            end;
            qryText.Next;
          until qryText.EOF;
        end;

      finally
        qryText.Free;
      end;


      if (IsDuplicates) then begin
        Application.MessageBox(PChar(Format('Такой номер договора ТО уже есть в договоре № %d!', [OriginalContractNumber])), 'Предупреждение', MB_ICONWARNING + MB_OK);
        //Exit;
      end
    end
    else begin
      Application.MessageBox('Номер договора ТО не является числом!', 'Предупреждение', MB_ICONWARNING + MB_OK);
      Exit;
    end;
  end;

  Result := True;
end;

function TfmNewCard.IsCheckedCode(AValue: string): Boolean;
begin
  Result := IsNumeric(Trim(AValue));
  if Result then begin
    if (FCard.CardID = 0) or (FOldContractNumber <> StrToInt(AValue)) then begin
      DM.qryContractNumberIsExists.Close;
      DM.qryContractNumberIsExists.Params.ParamByName('contract_number').AsString := Trim(AValue);
      DM.qryContractNumberIsExists.Open;

      Result := DM.qryContractNumberIsExists.IsEmpty;
    end;
  end
end;

function TfmNewCard.IsValidDate(ADate: TDateTime): Boolean;
var
  ADay, AMonth, AYear, AHour, AMinute, ASecond, AMilliSec: Word;
begin
  Result := True;
  try
    DecodeDateTime(ADate, AYear, AMonth, ADay, AHour, AMinute, ASecond, AMilliSec);
    Result := ADate > 0;
  except
    Result := False;
  end;
end;

procedure TfmNewCard.DocumentStatus;
begin
  if (FCard.CardID > 0) then
    Caption := 'Документ.Договор - редактирование'
  else
    Caption := 'Документ.Договор - новый';
end;

procedure TfmNewCard.ApplyUpdates;
begin

    FCard.ContractNumber := StrToInt(edCardId.Text);
    FCard.CreateDate := FormatDateTime('yyyy-mm-dd', dtCreateDate.Date);
    FCard.EquipmentID := Integer(cbEquipment.Items.Objects[cbEquipment.ItemIndex]);

    if dtEndContract.Text <> '' then
      FCard.EndContract := FormatDateTime('yyyy-mm-dd', dtEndContract.Date)
    else
      FCard.EndContract := '';

    if dtEndService.Text <> '' then
      FCard.EndService := FormatDateTime('yyyy-mm-dd', dtEndService.Date)
    else
      FCard.EndService := '';

    FCard.Repaid := chRepaid.Checked;
    FCard.CreditTo := FormatDateTime('yyyy-mm-dd', dtCreditTo.Date);
    FCard.CityID := Integer(cbCities.Items.Objects[cbCities.ItemIndex]);
    FCard.StreetID := Integer(cbStreets.Items.Objects[cbStreets.ItemIndex]);
    FCard.HouseID := Integer(cbHouses.Items.Objects[cbHouses.ItemIndex]);
    FCard.Porch := StrToInt(edPorch.Text);
    FCard.Numeration := edNumeration.Text;

    if dtOrderDateDoor.Text <> '' then
      FCard.OrderDateDoor := FormatDateTime('yyyy-mm-dd', dtOrderDateDoor.Date)
    else
      FCard.OrderDateDoor := '';

    if dtWillingnessDateDoor.Text <> '' then
      FCard.WillingnessDateDoor := FormatDateTime('yyyy-mm-dd', dtWillingnessDateDoor.Date)
    else
      FCard.WillingnessDateDoor := '';

    FCard.BrigadeID := Integer(cbBrigade.Items.Objects[cbBrigade.ItemIndex]);
    FCard.Mounting := Integer(cbMounting.Items.Objects[cbMounting.ItemIndex]);
    FCard.ClientID := Integer(cbClients.Items.Objects[cbClients.ItemIndex]);
    FCard.MClientID := Integer(cbMClients.Items.Objects[cbMClients.ItemIndex]);

    FCard.OnePerson := chOnePerson.Checked;
    FCard.MaintenanceContract := cbMaintenanceContract.ItemIndex;

    if dtStartService.Text <> '' then
      FCard.StartService := FormatDateTime('yyyy-mm-dd', dtStartService.Date)
    else
      FCard.StartService := '';

    if dtEndService.Text <> '' then
      FCard.EndService := FormatDateTime('yyyy-mm-dd', dtEndService.Date)
    else
      FCard.EndService := '';

    FCard.MContractNumber := edContractNumber.Text;
    if dtProlongation.Text <> '' then
      FCard.MProlongation := FormatDateTime('yyyy-mm-dd', dtProlongation.Date)
    else
      FCard.MProlongation := '';

    FCard.MRepaid := chmRepaid.Checked;
    if edPayment.Text <> '' then
      FCard.MPayment := StrToInt(edPayment.Text)
    else
      FCard.MPayment := 0;
    FCArd.MPaymentTypeID := Integer(cbPaymentTypes.Items.Objects[cbPaymentTypes.ItemIndex]);
    if edStartApartment.Text <> '' then
      FCard.MStartApartment := StrToInt(edStartApartment.Text)
    else
      FCard.MStartApartment := 0;
    if edEndApartment.Text <> '' then
      FCard.MEndApartment := StrToInt(edEndApartment.Text)
    else
      FCard.MEndApartment := 0;

    FCard.NormalPayment := edNormalPayment.Value;
    FCard.PrivilegePayment := edPrivilegePayment.Value;

    //ShowMessage(FloatToStr(edNormalPayment.Value));
    //ShowMessage(FloatToStr(FCard.NormalPayment));

    if dtReceiptPrinting.Text <> '' then
      FCard.ReceiptPrinting:= FormatDateTime('yyyy-mm-dd', dtReceiptPrinting.Date)
    else
      FCard.ReceiptPrinting := '';

    FCard.Attention := chAttention.Checked;
    FCard.DuplicateMaintenance :=  chDuplicateMaintenance.Checked;
    FCard.ContractInfo := StringReplace(edContractInfo.Lines.Text, '\', '', [rfReplaceAll, rfIgnoreCase]);
    FCard.ServiceInfo := StringReplace(edServiceInfo.Lines.Text, '\', '', [rfReplaceAll, rfIgnoreCase]);
    //
    FCard.OldEquipmentID := FCard.EquipmentID;
    FCard.OldCityID := FCard.CityID;
    FCard.OldStreetID := FCard.StreetID;
    FCard.OldHouseID := FCard.HouseID;
    FCard.OldBrigadeID := FCard.BrigadeID;
    FCard.OldMounting := FCard.Mounting;
    FCard.OldClientID := FCard.ClientID;
    FCard.OldMClientID := FCard.MClientID;
    FCard.OldMainTenanceContract := FCard.MaintenanceContract;
    FCard.OldMPaymentTypeID := FCard.MPaymentTypeID;
    //
    FCard.OldEquipmentName := cbEquipment.Text;
    FCard.OldCityName := cbCities.Text;
    FCard.OldStreetName := cbStreets.Text;
    FCard.OldHouseNumber := cbHouses.Text;
    FCard.OldBrigadeName := cbBrigade.Text;
    FCard.OldMountingName := cbMounting.Text;
    FCard.OldClientName := cbClients.Text;
    FCard.OldMClientName := cbMClients.Text;
    FCard.OldMainTenanceContractName := cbMaintenanceContract.Text;
    FCard.OldMPaymentTypeName := cbPaymentTypes.Text;

end;

procedure TfmNewCard.SaveData(AValue: Integer);
var
  fmSplash: TfmSplash;
begin
  if not Checked then Exit;
  fmSplash := TfmSplash.Create(Application);
  fmSplash.lbTitle.Caption := 'Сохранение данных';
  fmSplash.Show;
  fmSplash.Update;
  Application.ProcessMessages;

  SaveHistory;
  ApplyUpdates;
  SaveCard(AValue);

  //ShowMessage(IntToStr(FCard.CardID));
  //ShowMessage(FCard.StartService);
  DM.spTest2.ParamByName('p_card_id').AsInteger := FCard.CardID;
  DM.spTest2.ParamByName('p_start_service').AsString := FCard.StartService;
  DM.spTest2.ExecProc;

  fmSplash.Free;
end;

procedure TfmNewCard.MyMessageHandler(var Message: TLMessage);
begin
  //ShowMessage('111');
  //ShowMessage(Format('Документ № : %d', [Message.wParam]));
  // 14.06.2016 11:49:47
  if (CompareStr(FCard.MContractNumber, IntToStr(Message.wParam)) = 0) then begin
    LoadApartments(FCard.CardID);
    Application.MessageBox('Информация по платежам обновлена!', 'Внимание', MB_ICONINFORMATION + MB_OK);
  end;
end;

procedure TfmNewCard.LoadApartments(CardID: Integer);
begin
  if (FCard.CardID <> CardID) then Exit;

  FApartments.DisableControls;
  DM.qryRefApartments.Close;
  DM.qryRefApartments.ParamByName('card_id').AsInteger := CardID;
  DM.qryRefApartments.Open;

  if FApartments.Active then begin
    FApartments.Clear(False);
    FApartments.Close;
  end;
  FApartments.Open;
  if not DM.qryRefApartments.IsEmpty then begin
    FApartments.First;
    repeat
      FApartments.Append;
      FApartments.FieldByName('apartment_id').AsInteger  := DM.qryRefApartments.FieldByName('apartment_id').AsInteger;
      FApartments.FieldByName('paid').AsInteger          := DM.qryRefApartments.FieldByName('paid').AsInteger;
      FApartments.FieldByName('number').AsInteger        := DM.qryRefApartments.FieldByName('number').AsInteger;
      FApartments.FieldByName('card_id').AsInteger       := DM.qryRefApartments.FieldByName('card_id').AsInteger;
      FApartments.FieldByName('privilege').AsInteger     := DM.qryRefApartments.FieldByName('privilege').AsInteger;
      FApartments.FieldByName('exempt').AsInteger        := DM.qryRefApartments.FieldByName('exempt').AsInteger;
      FApartments.FieldByName('letter').AsInteger        := DM.qryRefApartments.FieldByName('letter').AsInteger;
      FApartments.FieldByName('calc_letter').AsString    := EncodeApartmentLetter(DM.qryRefApartments.FieldByName('letter').AsInteger);
      FApartments.FieldByName('half_paid').AsInteger     := DM.qryRefApartments.FieldByName('half_paid').AsInteger;
      FApartments.FieldByName('locked').AsInteger        := DM.qryRefApartments.FieldByName('locked').AsInteger;
      if (not DM.qryRefApartments.FieldByName('paid_dt').IsNull) then
        FApartments.FieldByName('paid_dt').AsString      := DM.qryRefApartments.FieldByName('paid_dt').AsString;
      FApartments.Post;
      DM.qryRefApartments.Next;
    until DM.qryRefApartments.EOF;
    FApartments.First;
  end;
  FApartments.EnableControls;
end;

procedure TfmNewCard.CheckPayments(CardID: Integer);
var
  qryGetApartments, qryFullPayment, qryCard: TZReadOnlyQuery;
  qryUpdateApartment: TZQuery;
  StartService, EndService: string;
  ApartmentID, Privilege: Integer;
  Amount: Currency;
begin
  (*

  30 Nov 2016

  1. Запрос загрузки квартир
  2. Узнать обычную, льготную плату
  3. Узнать, сколько заплатили с начала пролонгации, если галка "Оплачено" не проставлена
  4. Если есть оплата - проставить галку

  *)

  if (FCard.CardID <= 0) then
    Exit;

  StartService := '';
  EndService := '';

  if (FCard.StartService <> '') then
    StartService := FormatDateTime('YYYY-mm-dd', StrToDate(FCard.StartService));

  if (FCard.EndService <> '') then
      EndService := FormatDateTime('YYYY-mm-dd', StrToDate(FCard.EndService));

  qryGetApartments := TZReadOnlyQuery.Create(nil);
  qryGetApartments.Connection := DM.DBConn;

  qryUpdateApartment := TZQuery.Create(nil);
  qryUpdateApartment.Connection := DM.DBConn;

  qryFullPayment := TZReadOnlyQuery.Create(nil);
  qryFullPayment.Connection := DM.DBConn;

  qryGetApartments.Close;
  qryGetApartments.SQL.Text := Format('SELECT a.apartment_id, a.paid, a.number, a.card_id, a.privilege, a.exempt, a.letter, a.half_paid, a.locked, a.paid_dt FROM apartments a WHERE (a.card_id=%d AND a.paid=0 AND a.exempt=0) ORDER BY a.number, a.letter', [CardID]);
  qryGetApartments.Open;

  if (not qryGetApartments.IsEmpty) then begin
    qryGetApartments.First;
    repeat
      ApartmentID := qryGetApartments.FieldByName('apartment_id').AsInteger;
      Privilege := qryGetApartments.FieldByName('privilege').AsInteger;

      Amount := 0;
      qryFullPayment.Close;
      if (StartService <> '') and (EndService <> '') then begin
        qryFullPayment.SQL.Text := Format('select SUM(amount) AS amount from payments where (apartment_id=%d) and (pay_date >= ''%s'' and pay_date <= ''%s'')', [ApartmentID, StartService, EndService]);
      end
      else begin
        qryFullPayment.SQL.Text := Format('select SUM(amount) AS amount from payments where (apartment_id=%d)', [ApartmentID]);
      end;
      qryFullPayment.Open;

      if (not qryFullPayment.IsEmpty) then begin
        Amount := qryFullPayment.FieldByName('amount').AsCurrency;
        if (Privilege <> 0) then begin
          if (FCard.PrivilegePayment > 0) and (Amount > FCard.PrivilegePayment) then begin
            DM.qryUniversal3.Close;
            DM.qryUniversal3.SQL.Text := Format('update apartments set paid=%d, half_paid=%d, locked=0 where apartment_id=%d', [1, 2, ApartmentID]);
            DM.qryUniversal3.ExecSQL;
          end;
          if (FCard.PrivilegePayment > 0) and (Amount = FCard.PrivilegePayment) then begin
            DM.qryUniversal3.Close;
            DM.qryUniversal3.SQL.Text := Format('update apartments set paid=%d, half_paid=%d, locked=0 where apartment_id=%d', [1, 0, ApartmentID]);
            DM.qryUniversal3.ExecSQL;
          end;
          if (FCard.PrivilegePayment > 0) and (Amount < FCard.PrivilegePayment) and (Amount > 0) then begin
            DM.qryUniversal3.Close;
            DM.qryUniversal3.SQL.Text := Format('update apartments set paid=%d, half_paid=%d, locked=0 where apartment_id=%d', [1, 1, ApartmentID]);
            DM.qryUniversal3.ExecSQL;
          end;
        end
        else begin
          if (FCard.NormalPayment > 0) and (Amount > FCard.NormalPayment) then begin
            DM.qryUniversal3.Close;
            DM.qryUniversal3.SQL.Text := Format('update apartments set paid=%d, half_paid=%d, locked=0 where apartment_id=%d', [1, 2, ApartmentID]);
            DM.qryUniversal3.ExecSQL;
          end;
          if (FCard.NormalPayment > 0) and (Amount = FCard.NormalPayment) then begin
            DM.qryUniversal3.Close;
            DM.qryUniversal3.SQL.Text := Format('update apartments set paid=%d, half_paid=%d, locked=0 where apartment_id=%d', [1, 0, ApartmentID]);
            DM.qryUniversal3.ExecSQL;
          end;
          if (FCard.NormalPayment > 0) and (Amount < FCard.NormalPayment) and (Amount > 0) then begin
            DM.qryUniversal3.Close;
            DM.qryUniversal3.SQL.Text := Format('update apartments set paid=%d, half_paid=%d, locked=0 where apartment_id=%d', [1, 1, ApartmentID]);
            DM.qryUniversal3.ExecSQL;
          end;
        end;
      end;
      qryGetApartments.Next;
    until qryGetApartments.EOF;
  end;

  qryGetApartments.Free;
  qryUpdateApartment.Free;
  qryFullPayment.Free;

end;

procedure TfmNewCard.RefreshCostPayments(CityID: Integer);
begin
  if (CityID > 0) then begin
    DM.qryCostPayments.Close;
    DM.qryCostPayments.ParamByName('city_id').AsInteger := CityID;
    DM.qryCostPayments.Open;
    if (not DM.qryCostPayments.IsEmpty) then begin
      edNormalPayment.Value := DM.qryCostPayments.FieldByName('normal_payment').AsCurrency;
      edPrivilegePayment.Value := DM.qryCostPayments.FieldByName('privilege_payment').AsCurrency;
    end;
  end;
end;

procedure TfmNewCard.LoadData;
var
  NormalPayment, PrivilegePayment: Currency;
  FormatSettings, FormatSettings1: TFormatSettings;
begin
  if Assigned(FCard) then begin

    FormatSettings.ShortDateFormat := 'yyyy-mm-dd';
    FormatSettings.DateSeparator := '-';
    //FormatSettings.LongTimeFormat := 'hh:nn:ss';
    //FormatSettings.TimeSeparator := ':';

    FormatSettings1.ShortDateFormat := 'dd.MM.yyyy';
    FormatSettings1.DateSeparator := '.';
    //FormatSettings1.LongTimeFormat := 'hh:nn:ss';
    //FormatSettings1.TimeSeparator := ':';

    LoadRefs;
    // Основное
    FLastCardID := FCard.CardID;

    if (FCard.ContractNumber > 0) then
      edCardID.Text := IntToStr(FCard.ContractNumber);
    if (FCard.CreateDate <> '') then begin
      dtCreateDate.Text := DateToStr(StrToDate(FCard.CreateDate, FormatSettings), FormatSettings1);
    end
    else begin
      dtCreateDate.Text := '';
    end;

    //if FCard.EndContract <> '' then
    //  dtEndContract.Text := FCard.EndContract;
    if (FCard.EndContract <> '') then begin
      dtEndContract.Text := DateToStr(StrToDate(FCard.EndContract, FormatSettings), FormatSettings1);
    end
    else begin
      dtEndContract.Text := '';
    end;
    //if FCard.CreditTo <> '' then
    //  dtCreditTo.Text := FCard.CreditTo;
    if (FCard.CreditTo <> '') then begin
      dtCreditTo.Text := DateToStr(StrToDate(FCard.CreditTo, FormatSettings), FormatSettings1);
    end
    else begin
      dtCreditTo.Text := '';
    end;
    chRepaid.Checked := FCard.Repaid;
    //
    if (FCard.Porch > 0) then
      edPorch.Text := IntToStr(FCard.Porch);
    edNumeration.Text := FCard.Numeration;
    // Старший по договору
    //lbClientIdentityCard.Caption := Passport(FCard.ClientID);
    //lbClientRegistration.Caption := Residence(FCard.ClientID, 0);
    //lbClientActualResidence.Caption := Residence(FCard.ClientID, 1);
    ShowClientInfo(FCard.ClientID);
    //edClientPhones.Text := FCard.Client.Phones;

    // Техобслуживание
    //dtStartService.Text := FCard.StartService;
    if (FCard.StartService <> '') then begin
      dtStartService.Text := DateToStr(StrToDate(FCard.StartService, FormatSettings), FormatSettings1);
    end
    else begin
      dtStartService.Text := '';
    end;
    //dtEndService.Text := FCard.EndService;
    if (FCard.EndService <> '') then begin
      dtEndService.Text := DateToStr(StrToDate(FCard.EndService, FormatSettings), FormatSettings1);
    end
    else begin
      dtEndService.Text := '';
    end;
    edContractNumber.Text := FCard.MContractNumber;
    //dtProlongation.Text := FCard.MProlongation;
    if (FCard.MProlongation <> '') then begin
      dtProlongation.Text := DateToStr(StrToDate(FCard.MProlongation, FormatSettings), FormatSettings1);
    end
    else begin
      dtProlongation.Text := '';
    end;
    chmRepaid.Checked := FCard.MRepaid;
    if (FCard.MPayment > 0) then
      edPayment.Text := IntToStr(FCard.MPayment);
    if (FCard.MStartApartment > 0) then
      edStartApartment.Text := IntToStr(FCard.MStartApartment);
    if (FCard.MEndApartment > 0) then
      edEndApartment.Text := IntToStr(FCard.MEndApartment);

    if (FCard.CardID > 0) then begin
      edNormalPayment.Value := FCard.NormalPayment;
      edPrivilegePayment.Value := FCard.PrivilegePayment;
    end;

    if (FCard.ReceiptPrinting <> '') then begin
      dtReceiptPrinting.Text := DateToStr(StrToDate(FCard.ReceiptPrinting, FormatSettings), FormatSettings1);
    end
    else begin
      dtReceiptPrinting.Text := '';
    end;

    // Старший по техобслуживанию
    //lbMClientIdentityCard.Caption := Passport(FCard.MClientID);
    //lbMClientRegistration.Caption := Residence(FCard.MClientID, 0);
    //lbMClientActualResidence.Caption := Residence(FCard.MClientID, 1);
    ShowMClientInfo(FCard.MClientID);
    //edMClientPhones.Text := FCard.MClient.Phones;

    chOnePerson.Checked := FCard.OnePerson;
    // Дополнительно
    chAttention.Checked := FCard.Attention;
    chDuplicateMaintenance.Checked := FCard.DuplicateMaintenance;
    edContractInfo.Lines.Text := FCard.ContractInfo;
    edServiceInfo.Lines.Text := FCard.ServiceInfo;

    FCard.OldEquipmentName := cbEquipment.Text;
    FCard.OldCityName := cbCities.Text;
    FCard.OldStreetName := cbStreets.Text;
    FCard.OldHouseNumber := cbHouses.Text;
    FCard.OldBrigadeName := cbBrigade.Text;
    FCard.OldMountingName := cbMounting.Text;
    FCard.OldClientName := cbClients.Text;
    FCard.OldMClientName := cbMClients.Text;
    FCard.OldMainTenanceContractName := cbMaintenanceContract.Text;
    FCard.OldMPaymentTypeName := cbPaymentTypes.Text;

    DocumentStatus;
    FOldContractNumber := FCard.ContractNumber;
    FOldProlongedContract := FCard.MContractNumber;
    //ShowDebtors;
    cbMaintenanceContractCloseUp(cbMaintenanceContract);
  end;
end;

end.

