// src/App.jsx
import React from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";

/**
 * Single-file Redux Toolkit shopping cart demo.
 * Contains:
 *  - cart slice (add/remove/update/clear)
 *  - store creation
 *  - ProductList and Cart components
 *  - App component that mounts Provider and UI
 *
 * Paste this into src/App.jsx in a React project (Vite/CRA).
 */

/* --------- Redux slice --------- */
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [] // { id, name, price, quantity }
  },
  reducers: {
    addItem: (state, action) => {
      const { id, name, price } = action.payload;
      const existing = state.items.find(i => i.id === id);
      if (existing) existing.quantity += 1;
      else state.items.push({ id, name, price, quantity: 1 });
    },
    removeItem: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(i => i.id !== id);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const it = state.items.find(i => i.id === id);
      if (!it) return;
      if (quantity <= 0) state.items = state.items.filter(i => i.id !== id);
      else it.quantity = quantity;
    },
    clearCart: state => {
      state.items = [];
    }
  }
});

const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;

/* --------- Store --------- */
const store = configureStore({
  reducer: {
    cart: cartSlice.reducer
  }
});

/* --------- Sample products --------- */
const PRODUCTS = [
  { id: "P1001", name: "Wireless Mouse", price: 799 },
  { id: "P1002", name: "Mechanical Keyboard", price: 2499 },
  { id: "P1003", name: "Portable SSD 1TB", price: 5999 },
  { id: "P1004", name: "USB-C Hub", price: 1299 }
];

/* --------- ProductList Component --------- */
function ProductList() {
  const dispatch = useDispatch();

  return (
    <div style={styles.card}>
      <h2 style={styles.h2}>Products</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {PRODUCTS.map(p => (
          <div key={p.id} style={styles.productRow}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ color: "#555" }}>₹ {p.price}</div>
            </div>
            <div>
              <button
                onClick={() => dispatch(addItem(p))}
                style={styles.addButton}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------- Cart Component --------- */
function Cart() {
  const items = useSelector(s => s.cart.items);
  const dispatch = useDispatch();
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div style={styles.card}>
      <h2 style={styles.h2}>Cart</h2>

      {items.length === 0 ? (
        <p style={{ color: "#666" }}>Your cart is empty.</p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12 }}>
            {items.map(item => (
              <div key={item.id} style={styles.cartRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ color: "#666" }}>₹ {item.price} each</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={e => {
                      const q = Number(e.target.value) || 0;
                      dispatch(updateQuantity({ id: item.id, quantity: q }));
                    }}
                    style={styles.qtyInput}
                    aria-label={`qty-${item.id}`}
                  />
                  <div style={{ width: 90, textAlign: "right", fontWeight: 700 }}>
                    ₹ {item.price * item.quantity}
                  </div>
                  <button
                    onClick={() => dispatch(removeItem(item.id))}
                    style={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div style={styles.totalRow}>
              <div style={{ fontWeight: 800 }}>Total</div>
              <div style={{ fontWeight: 800 }}>₹ {total}</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => alert("Checkout not implemented in demo")}
                style={{ ...styles.actionButton, background: "#2e7d32", color: "#fff", flex: 1 }}
              >
                Checkout
              </button>
              <button
                onClick={() => dispatch(clearCart())}
                style={{ ...styles.actionButton, background: "#bdbdbd" }}
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* --------- Main App (Provider included here so this file is standalone) --------- */
export default function AppWrapper() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}

function MainApp() {
  return (
    <div style={styles.app}>
      <h1 style={{ textAlign: "center" }}>Redux Toolkit — Shopping Cart (Single File)</h1>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 18 }}>
        <ProductList />
        <Cart />
      </div>
      <footer style={{ marginTop: 24, color: "#666", textAlign: "center" }}>
        Demo — state managed with Redux Toolkit (single-file App.jsx). Add / update / remove items.
      </footer>
    </div>
  );
}

/* --------- Inline styles --------- */
const styles = {
  app: {
    maxWidth: 980,
    margin: "28px auto",
    padding: 12,
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
  },
  card: {
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 14,
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
  },
  h2: { margin: "0 0 12px" },
  productRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #f0f0f0"
  },
  addButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#1976d2",
    color: "#fff",
    cursor: "pointer"
  },
  cartRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #fafafa"
  },
  qtyInput: {
    width: 64,
    padding: 6,
    borderRadius: 6,
    border: "1px solid #ccc"
  },
  removeButton: {
    background: "transparent",
    border: "none",
    color: "crimson",
    cursor: "pointer"
  },
  totalRow: {
    borderTop: "1px solid #eee",
    paddingTop: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  actionButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    flex: 1
  }
};
