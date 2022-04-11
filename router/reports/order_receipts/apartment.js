class Apartment {
  constructor() {
    this.id = 0;
    this.number = 0;
    this.letter = 0;
    this.privilege = 0;
    this.locked = 0;
    this.exempt = 0;
    this.payment = {
      current: 0,
      currentYear: 0,
      firstYear: 0,
      secondYear: 0,
    };
    this.debt = {
      firstYear: 0,
      secondYear: 0,
    };
    this.enableCalc = {
      firstYear: false,
      secondYear: false,
    };
  }

  calcDebt() {
    let debt = 0;

    let fullSecondYearDebt = false;
    let fullFirstYearDebt = false;

    // Есть полный долг за второй год
    if (
      this.enableCalc.secondYear && this.debt.secondYear === this.payment.secondYear
    ) {
      fullSecondYearDebt = true;
    }

    // Есть полный долг за первый год
    if (
      this.enableCalc.firstYear && this.debt.firstYear === this.payment.firstYear
    ) {
      fullFirstYearDebt = true;
    }

    if (fullFirstYearDebt && fullSecondYearDebt) {
      debt = this.payment.firstYear;
    } else {
      if (this.enableCalc.secondYear && this.debt.secondYear > 0) {
        if (this.debt.secondYear === this.payment.secondYear) {
          debt = this.payment.secondYear; // debt = 0;
        } else if (this.debt.secondYear < this.payment.secondYear) {
          debt = this.payment.secondYear - this.debt.secondYear; // debt = this.debt.secondYear;
        }
      }
      if (this.enableCalc.firstYear) {
        debt += this.debt.firstYear;
      }
      //
      if (this.enableCalc.firstYear && this.enableCalc.secondYear) {
        if (this.debt.firstYear + this.debt.secondYear === 0) {
          debt = 0;
        }
      }
    }

    return debt;
  }
}

module.exports.Apartment = Apartment;
