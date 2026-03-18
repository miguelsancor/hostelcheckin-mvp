const {
    createBoldPayment,
    getPaymentByReserva
  } = require("./payment.service");
  
  async function createBold(req, res) {
    try {
      const { numeroReserva, monto, descripcion } = req.body;
  
      if (!numeroReserva || !monto) {
        return res.status(400).json({
          ok: false,
          message: "numeroReserva y monto son obligatorios"
        });
      }
  
      const payment = await createBoldPayment({
        numeroReserva,
        monto,
        descripcion
      });
  
      // 🔥 AQUÍ luego conectas con Bold real
      const fakeCheckoutUrl = `https://bold.co/pay/demo/${payment.id}`;
  
      return res.json({
        ok: true,
        paymentId: payment.id,
        checkoutUrl: fakeCheckoutUrl
      });
  
    } catch (error) {
      console.error("Error createBold:", error);
      return res.status(500).json({
        ok: false,
        message: "Error creando pago"
      });
    }
  }
  
  async function getPayment(req, res) {
    try {
      const { numeroReserva } = req.params;
  
      const payment = await getPaymentByReserva(numeroReserva);
  
      return res.json({
        ok: true,
        payment
      });
  
    } catch (error) {
      console.error("Error getPayment:", error);
      return res.status(500).json({
        ok: false
      });
    }
  }
  
  module.exports = {
    createBold,
    getPayment
  };