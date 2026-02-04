
const API = "/api";

const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const userCoins = document.getElementById("userCoins");
const userCard = document.getElementById("userCard");
const logoutBtn = document.getElementById("logoutBtn");
const notifBtn = document.getElementById("notifBtn");
const notifBadge = document.getElementById("notifBadge");
const notifPanel = document.getElementById("notifPanel");
const notifList = document.getElementById("notifList");
const notifClearBtn = document.getElementById("notifClearBtn");
const toast = document.getElementById("toast");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const modalClose = document.getElementById("modalClose");
const normsModal = document.getElementById("normsModal");
const normsClose = document.getElementById("normsClose");
const viewNormsBtn = document.getElementById("viewNormsBtn");
const rememberModal = document.getElementById("rememberModal");
const rememberSession = document.getElementById("rememberSession");
const rememberBrowser = document.getElementById("rememberBrowser");
const rememberCancel = document.getElementById("rememberCancel");
const rememberConfirm = document.getElementById("rememberConfirm");

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const productForm = document.getElementById("productForm");
const prodId = document.getElementById("prodId");
const prodNombre = document.getElementById("prodNombre");
const prodDescripcion = document.getElementById("prodDescripcion");
const prodPrecio = document.getElementById("prodPrecio");
const prodStock = document.getElementById("prodStock");
const prodCancel = document.getElementById("prodCancel");
const prodImage = document.getElementById("prodImage");
const prodPreview = document.getElementById("prodPreview");

const productsList = document.getElementById("productsList");
const myProductsList = document.getElementById("myProductsList");
const popularList = document.getElementById("popularList");
const receiptsList = document.getElementById("receiptsList");
const receiptsClearBtn = document.getElementById("receiptsClearBtn");

const adminPanel = document.getElementById("adminPanel");
const adminCommissions = document.getElementById("adminCommissions");
const adminCounts = document.getElementById("adminCounts");
const adminPromoted = document.getElementById("adminPromoted");
const adminInvites = document.getElementById("adminInvites");
const addInvitesBtn = document.getElementById("addInvitesBtn");
const creditsList = document.getElementById("creditsList");
const creditForm = document.getElementById("creditForm");
const creditCard = document.getElementById("creditCard");
const creditAmount = document.getElementById("creditAmount");
const creditNote = document.getElementById("creditNote");
const resetBtn = document.getElementById("resetBtn");


let currentUser = null;
let lastSeen = null;
let lastToastId = null;
let notifClearAt = null;
let receiptClearAt = null;
let currentImageData = "";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_DIM = 1600;


function saveUser(user, remember = true) {
  currentUser = user;
  const data = JSON.stringify(user);
  if (remember) {
    localStorage.setItem("user", data);
    sessionStorage.removeItem("user");
  } else {
    sessionStorage.setItem("user", data);
    localStorage.removeItem("user");
  }
  renderUser();
}

function loadUser() {
  const data = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (data) {
    currentUser = JSON.parse(data);
  }
  const lastUsername = localStorage.getItem("lastUsername");
  if (!currentUser && lastUsername && loginForm) {
    const loginNombre = document.getElementById("loginNombre");
    if (loginNombre) loginNombre.value = lastUsername;
  }
  const userId = currentUser ? currentUser.id : "guest";
  lastSeen = localStorage.getItem(`lastSeen:${userId}`) || null;
  lastToastId = localStorage.getItem(`lastToastId:${userId}`) || null;
  notifClearAt = localStorage.getItem(`notifClearAt:${userId}`) || null;
  receiptClearAt = localStorage.getItem(`receiptClearAt:${userId}`) || null;
  renderUser();
}


function renderUser() {
  if (currentUser) {
    userName.textContent = `${currentUser.nombre} (${currentUser.rol})`;
    userCoins.textContent = `Monedas: ${currentUser.monedas}`;
    const card = currentUser.card_code
      ? currentUser.card_code.replace(/-/g, "")
      : "-";
    userCard.textContent = `Tarjeta: ${card}`;
    logoutBtn.hidden = false;
    authSection.hidden = true;
    authSection.style.display = "none";
    appSection.hidden = false;
    appSection.style.display = "block";
    adminPanel.hidden = !currentUser.is_admin;
    notifBtn.hidden = false;
  } else {
    userName.textContent = "Invitado";
    userCoins.textContent = "Monedas: 0";
    userCard.textContent = "Tarjeta: -";
    logoutBtn.hidden = true;
    authSection.hidden = false;
    authSection.style.display = "grid";
    appSection.hidden = true;
    appSection.style.display = "none";
    adminPanel.hidden = true;
    notifBtn.hidden = true;
    notifPanel.hidden = true;
    notifBadge.hidden = true;
  }
}


async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Error desconocido");
  }
  return data;
}

function clearAuthForms() {
  registerForm.reset();
  loginForm.reset();
  document.getElementById("regContacto").value = "+57";
  document.getElementById("regVerify").value = "";
  document.getElementById("regAdminCode").value = "";
  const lastUsername = localStorage.getItem("lastUsername");
  const loginNombre = document.getElementById("loginNombre");
  if (loginNombre && lastUsername) loginNombre.value = lastUsername;
}

function openRememberModal() {
  if (!rememberModal) return Promise.resolve({ session: false, browser: false });
  return new Promise((resolve) => {
    rememberSession.checked = true;
    rememberBrowser.checked = true;
    rememberModal.hidden = false;
    rememberModal.style.display = "flex";
    const finish = (result) => {
      rememberModal.hidden = true;
      rememberModal.style.display = "none";
      resolve(result);
    };
    const onConfirm = () =>
      finish({
        session: rememberSession.checked,
        browser: rememberBrowser.checked,
      });
    const onCancel = () => finish({ session: false, browser: false });
    const onBackdrop = (e) => {
      if (e.target === rememberModal) onCancel();
    };
    const onEscape = (e) => {
      if (e.key === "Escape") onCancel();
    };
    rememberConfirm.onclick = onConfirm;
    rememberCancel.onclick = onCancel;
    rememberModal.onclick = onBackdrop;
    document.addEventListener("keydown", onEscape, { once: true });
  });
}

async function refreshUserFromServer() {
  if (!currentUser) return;
  try {
    const data = await fetchJSON(`${API}/users/${currentUser.id}`);
    saveUser(data.user);
  } catch (err) {

  }
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    nombre: document.getElementById("regNombre").value.trim(),
    curso: document.getElementById("regCurso").value,
    rol: document.getElementById("regRol").value,
    contacto: document.getElementById("regContacto").value.trim(),
    verifyCode: document.getElementById("regVerify").value.trim(),
    adminCode: document.getElementById("regAdminCode").value.trim(),
    password: document.getElementById("regPassword").value,
  };

  if (body.nombre.length < 10) {
    alert("El nombre debe tener al menos 10 caracteres");
    return;
  }

  if (body.contacto === "+57") {
    alert("Agrega tu número después del +57");
    return;
  }

  try {
    const data = await fetchJSON(`${API}/register`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const remember = await openRememberModal();
    saveUser(data.user, remember.session);
    if (remember.browser) {
      localStorage.setItem("lastUsername", data.user.nombre);
    } else {
      localStorage.removeItem("lastUsername");
    }
    clearAuthForms();
    await refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    nombre: document.getElementById("loginNombre").value.trim(),
    password: document.getElementById("loginPassword").value,
  };

  try {
    const data = await fetchJSON(`${API}/login`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const remember = await openRememberModal();
    saveUser(data.user, remember.session);
    if (remember.browser) {
      localStorage.setItem("lastUsername", data.user.nombre);
    } else {
      localStorage.removeItem("lastUsername");
    }
    clearAuthForms();
    await refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  clearAuthForms();
  renderUser();
});

notifBtn.addEventListener("click", () => {
  const isHidden = notifPanel.hidden;
  notifPanel.hidden = !isHidden;
  if (!isHidden) return;
  lastSeen = new Date().toISOString();
  if (currentUser) {
    localStorage.setItem(`lastSeen:${currentUser.id}`, lastSeen);
  }
  notifBadge.hidden = true;
});

if (notifClearBtn) {
  notifClearBtn.addEventListener("click", () => {
    notifClearAt = new Date().toISOString();
    if (currentUser) {
      localStorage.setItem(`notifClearAt:${currentUser.id}`, notifClearAt);
    }
    notifList.innerHTML = "<div class='item'>Sin notificaciones.</div>";
    notifBadge.hidden = true;
  });
}

if (receiptsClearBtn) {
  receiptsClearBtn.addEventListener("click", () => {
    receiptClearAt = new Date().toISOString();
    if (currentUser) {
      localStorage.setItem(`receiptClearAt:${currentUser.id}`, receiptClearAt);
    }
    receiptsList.innerHTML = "<div class='item'>Sin comprobantes.</div>";
  });
}

document.addEventListener("click", (e) => {
  if (!notifPanel || notifPanel.hidden) return;
  if (e.target === notifBtn || notifPanel.contains(e.target)) return;
  notifPanel.hidden = true;
});

if (toast) {
  toast.addEventListener("click", () => {
    notifPanel.hidden = false;
    lastSeen = new Date().toISOString();
    if (currentUser) {
      localStorage.setItem(`lastSeen:${currentUser.id}`, lastSeen);
    }
    notifBadge.hidden = true;
  });
}

async function compressImageToDataUrl(file) {
  const img = new Image();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  let { width, height } = img;
  const maxDim = Math.max(width, height);
  if (maxDim > MAX_IMAGE_DIM) {
    const scale = MAX_IMAGE_DIM / maxDim;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > MAX_IMAGE_BYTES * 1.37 && quality > 0.4) {
    quality -= 0.1;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return out;
}

if (prodImage) {
  prodImage.addEventListener("change", async () => {
    const file = prodImage.files && prodImage.files[0];
    if (!file) {
      currentImageData = "";
      if (prodPreview) prodPreview.hidden = true;
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("El archivo debe ser una imagen");
      prodImage.value = "";
      return;
    }

    try {
      if (file.size <= MAX_IMAGE_BYTES) {
        const reader = new FileReader();
        reader.onload = () => {
          currentImageData = String(reader.result || "");
          if (prodPreview) {
            prodPreview.src = currentImageData;
            prodPreview.hidden = false;
          }
        };
        reader.readAsDataURL(file);
      } else {
        currentImageData = await compressImageToDataUrl(file);
        if (prodPreview) {
          prodPreview.src = currentImageData;
          prodPreview.hidden = false;
        }
      }
    } catch (err) {
      alert("No se pudo procesar la imagen");
    }
  });
}

creditForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser || !currentUser.is_admin) return;
  const body = {
    cardCode: creditCard.value.trim().toUpperCase(),
    amount: Number(creditAmount.value),
    note: creditNote.value.trim(),
    adminId: currentUser.id,
  };

  try {
    const data = await fetchJSON(`${API}/admin/credit`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (currentUser && data.user && data.user.id === currentUser.id) {
      saveUser(data.user);
    }
    creditCard.value = "";
    creditAmount.value = "";
    creditNote.value = "";
    alert(`Saldo actualizado para ${data.user.nombre}`);
  } catch (err) {
    alert(err.message);
  }
});

if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    if (!currentUser || !currentUser.is_admin) return;
    if (!confirm("Esto borrará TODO. ¿Continuar?")) return;
    try {
      await fetchJSON(`${API}/admin/reset`, {
        method: "POST",
        body: JSON.stringify({ adminId: currentUser.id }),
      });
      alert("Datos reiniciados. Debes volver a registrarte.");
      currentUser = null;
      localStorage.removeItem("user");
      renderUser();
    } catch (err) {
      alert(err.message);
    }
  });
}

if (addInvitesBtn) {
  addInvitesBtn.addEventListener("click", async () => {
    if (!currentUser || !currentUser.is_admin) return;
    try {
      await fetchJSON(`${API}/admin/invites/add`, {
        method: "POST",
        body: JSON.stringify({ adminId: currentUser.id, count: 80 }),
      });
      alert("Se agregaron 80 códigos.");
      await loadAdmin();
    } catch (err) {
      alert(err.message);
    }
  });
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const body = {
    sellerId: currentUser.id,
    nombre: prodNombre.value.trim(),
    descripcion: prodDescripcion.value.trim(),
    precio: Number(prodPrecio.value),
    stock: Number(prodStock.value),
    imageData: currentImageData,
  };

  try {
    if (prodId.value) {
      await fetchJSON(`${API}/products/${prodId.value}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } else {
      await fetchJSON(`${API}/products`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    clearProductForm();
    await refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

prodCancel.addEventListener("click", () => {
  clearProductForm();
});

function clearProductForm() {
  prodId.value = "";
  prodNombre.value = "";
  prodDescripcion.value = "";
  prodPrecio.value = "";
  prodStock.value = "";
  currentImageData = "";
  if (prodImage) prodImage.value = "";
  if (prodPreview) prodPreview.hidden = true;
}

function contactoLink(contacto) {
  const text = contacto.trim();
  if (text.includes("@")) return `mailto:${text}`;
  if (text.startsWith("http")) return text;
  const phone = text.replace(/[^0-9]/g, "");
  return `https://wa.me/${phone}`;
}


function renderProducts(container, products, options = {}) {
  container.innerHTML = "";
  if (!products.length) {
    container.innerHTML = "<div class='item'>No hay productos.</div>";
    return;
  }

  products.forEach((p) => {
    const el = document.createElement("div");
    el.className = "item";

    const promoted = p.promoted_until && new Date(p.promoted_until) >= new Date();

    el.innerHTML = `
      <div><strong>${p.nombre}</strong> ${promoted ? "(Popular)" : ""}</div>
      ${
        p.image_data
          ? `<img class="product-image" data-zoom="1" src="${p.image_data}" alt="Imagen de producto" />`
          : ""
      }
      <div>${p.descripcion}</div>
      <div class="price">Precio: ${p.precio} monedas</div>
      <div>Stock: ${p.stock}</div>
      <div>Vendedor: ${p.vendedor_nombre || ""} ${p.vendedor_curso ? `(${p.vendedor_curso})` : ""}</div>
      <div class="actions"></div>
    `;

    const actions = el.querySelector(".actions");
    const zoomImage = el.querySelector("[data-zoom]");
    if (zoomImage) {
      zoomImage.addEventListener("click", () => openImageModal(zoomImage.src));
    }

    if (options.showBuy) {
      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = "1";
      qtyInput.value = "1";
      qtyInput.style.width = "80px";

      const buyBtn = document.createElement("button");
      buyBtn.className = "btn";
      buyBtn.textContent = "Comprar";
      buyBtn.addEventListener("click", async () => {
        try {
          const data = await fetchJSON(`${API}/purchase`, {
            method: "POST",
            body: JSON.stringify({
              productId: p.id,
              buyerId: currentUser.id,
              quantity: Number(qtyInput.value),
            }),
          });
          saveUser(data.buyer);
          await refreshAll();
          alert("Compra realizada");
        } catch (err) {
          alert(err.message);
        }
      });

      const contactBtn = document.createElement("button");
      contactBtn.className = "btn ghost";
      contactBtn.textContent = "Contactar";
      contactBtn.addEventListener("click", () => {
        const url = contactoLink(p.vendedor_contacto || "");
        window.open(url, "_blank");
      });

      actions.appendChild(qtyInput);
      actions.appendChild(buyBtn);
      actions.appendChild(contactBtn);
    }

    if (options.showOwnerActions) {
      const editBtn = document.createElement("button");
      editBtn.className = "btn ghost";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => {
        prodId.value = p.id;
        prodNombre.value = p.nombre;
        prodDescripcion.value = p.descripcion;
        prodPrecio.value = p.precio;
        prodStock.value = p.stock;
        currentImageData = p.image_data || "";
        if (prodPreview) {
          if (currentImageData) {
            prodPreview.src = currentImageData;
            prodPreview.hidden = false;
          } else {
            prodPreview.hidden = true;
          }
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn ghost";
      delBtn.textContent = "Eliminar";
      delBtn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar producto?")) return;
        try {
          await fetchJSON(`${API}/products/${p.id}`, {
            method: "DELETE",
            body: JSON.stringify({ sellerId: currentUser.id }),
          });
          await refreshAll();
        } catch (err) {
          alert(err.message);
        }
      });

      const promoBtn = document.createElement("button");
      promoBtn.className = "btn";
      promoBtn.textContent = "Promocionar (10 monedas)";
      promoBtn.addEventListener("click", async () => {
        try {
          const data = await fetchJSON(`${API}/products/${p.id}/promote`, {
            method: "POST",
            body: JSON.stringify({ sellerId: currentUser.id }),
          });
          if (data.seller) {
            saveUser(data.seller);
          }
          await refreshAll();
        } catch (err) {
          alert(err.message);
        }
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      actions.appendChild(promoBtn);
    }

    container.appendChild(el);
  });
}

function renderReceipts(purchases) {
  receiptsList.innerHTML = "";
  if (!purchases.length) {
    receiptsList.innerHTML = "<div class='item'>No hay comprobantes.</div>";
    return;
  }

  const cleared = receiptClearAt ? new Date(receiptClearAt) : null;
  const filtered = purchases.filter((p) => {
    if (!cleared) return true;
    return new Date(p.created_at) > cleared;
  });

  if (!filtered.length) {
    receiptsList.innerHTML = "<div class='item'>Sin comprobantes.</div>";
    return;
  }

  filtered.forEach((p) => {
    const el = document.createElement("div");
    el.className = "item";

    const isBuyer = currentUser && p.buyer_id === currentUser.id;
    const title = isBuyer ? "Compra" : "Venta";

    el.innerHTML = `
      <div><strong>${title}</strong> - ${p.producto_nombre}</div>
      <div>Cantidad: ${p.quantity}</div>
      <div>Total: ${p.total} monedas</div>
      <div>Comprador: ${p.comprador_nombre}</div>
      <div>Vendedor: ${p.vendedor_nombre}</div>
      <div>Fecha: ${new Date(p.created_at).toLocaleString()}</div>
    `;

    receiptsList.appendChild(el);
  });
}

function renderNotifications(purchases) {
  notifList.innerHTML = "";
  if (!purchases.length) {
    notifList.innerHTML = "<div class='item'>Sin notificaciones.</div>";
    return;
  }

  const last = lastSeen ? new Date(lastSeen) : null;
  const cleared = notifClearAt ? new Date(notifClearAt) : null;
  let unseen = 0;

  const filtered = purchases.filter((p) => {
    if (!cleared) return true;
    return new Date(p.created_at) > cleared;
  });

  if (!filtered.length) {
    notifList.innerHTML = "<div class='item'>Sin notificaciones.</div>";
    notifBadge.hidden = true;
    return;
  }

  filtered.slice(0, 5).forEach((p) => {
    const el = document.createElement("div");
    el.className = "item";

    const isBuyer = currentUser && p.buyer_id === currentUser.id;
    const title = isBuyer ? "Compra" : "Venta";
    const created = new Date(p.created_at);
    if (!last || created > last) unseen += 1;

    el.innerHTML = `
      <div><strong>${title}</strong> - ${p.producto_nombre}</div>
      <div>Total: ${p.total} monedas</div>
      <div>${created.toLocaleString()}</div>
    `;
    notifList.appendChild(el);
  });

  if (unseen > 0) {
    notifBadge.textContent = String(unseen);
    notifBadge.hidden = false;
  } else {
    notifBadge.hidden = true;
  }
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}

function openImageModal(src) {
  if (!imageModal || !modalImage) return;
  modalImage.src = src;
  imageModal.hidden = false;
  imageModal.style.display = "flex";
}

function closeImageModal() {
  if (!imageModal) return;
  imageModal.hidden = true;
  imageModal.style.display = "none";
  if (modalImage) modalImage.src = "";
}

if (modalClose) {
  modalClose.addEventListener("click", closeImageModal);
}

if (imageModal) {
  imageModal.style.display = "none";
  imageModal.addEventListener("click", (e) => {
    if (e.target === imageModal) closeImageModal();
  });
}

function openNormsModal() {
  if (!normsModal) return;
  normsModal.hidden = false;
  normsModal.style.display = "flex";
}

function closeNormsModal() {
  if (!normsModal) return;
  normsModal.hidden = true;
  normsModal.style.display = "none";
}

if (viewNormsBtn) {
  viewNormsBtn.addEventListener("click", openNormsModal);
}

if (normsClose) {
  normsClose.addEventListener("click", closeNormsModal);
}

if (normsModal) {
  normsModal.style.display = "none";
  normsModal.addEventListener("click", (e) => {
    if (e.target === normsModal) closeNormsModal();
  });
}
if (rememberModal) {
  rememberModal.style.display = "none";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeImageModal();
    closeNormsModal();
  }
});

async function loadProducts() {
  const data = await fetchJSON(`${API}/products`);
  const products = data.products || [];

  renderProducts(productsList, products, { showBuy: !!currentUser });

  if (currentUser) {
    const mine = products.filter((p) => p.seller_id === currentUser.id);
    renderProducts(myProductsList, mine, { showOwnerActions: true });
  }
}

async function loadPopular() {
  const data = await fetchJSON(`${API}/products/popular`);
  renderProducts(popularList, data.products || [], { showBuy: !!currentUser });
}

async function loadReceipts() {
  if (!currentUser) return;
  const data = await fetchJSON(`${API}/purchases?userId=${currentUser.id}`);
  const purchases = data.purchases || [];
  renderReceipts(purchases);
  renderNotifications(purchases);

  if (purchases.length > 0) {
    const newest = purchases[0];
    const newestId = String(newest.id);
    if (lastToastId !== newestId) {
      const isBuyer = newest.buyer_id === currentUser.id;
      const title = isBuyer ? "Nueva compra" : "Nueva venta";
      showToast(`${title}: ${newest.producto_nombre} (${newest.total} monedas)`);
      lastToastId = newestId;
      localStorage.setItem(`lastToastId:${currentUser.id}`, newestId);
    }
  }
}

async function loadAdmin() {
  if (!currentUser || !currentUser.is_admin) {
    adminCommissions.textContent = "Comisiones: 0";
    adminPromoted.innerHTML = "<div class='item'>Solo admins.</div>";
    if (adminCounts) adminCounts.textContent = "Usuarios: 0 | Admins: 0";
    if (adminInvites) adminInvites.innerHTML = "<div class='item'>Solo admins.</div>";
    if (creditsList) creditsList.innerHTML = "<div class='item'>Solo admins.</div>";
    return;
  }

  try {
    const stats = await fetchJSON(
      `${API}/admin/stats?adminId=${currentUser.id}`
    );
    if (adminCounts) {
      adminCounts.textContent = `Usuarios: ${stats.users} | Admins: ${stats.admins}`;
    }

    const invites = await fetchJSON(
      `${API}/admin/invites?adminId=${currentUser.id}`
    );
    if (adminInvites) {
      if (!invites.codes.length) {
        adminInvites.innerHTML = "<div class='item'>Sin códigos disponibles.</div>";
      } else {
        adminInvites.innerHTML = `<div class='item'>${invites.codes.join(
          ", "
        )}</div>`;
      }
    }

    const credits = await fetchJSON(
      `${API}/admin/credits?adminId=${currentUser.id}`
    );
    if (creditsList) {
      if (!credits.credits.length) {
        creditsList.innerHTML = "<div class='item'>Sin recargas.</div>";
      } else {
        creditsList.innerHTML = "";
        credits.credits.forEach((c) => {
          const el = document.createElement("div");
          el.className = "item";
          el.innerHTML = `
            <div><strong>${c.usuario}</strong> - ${c.amount} monedas</div>
            <div>Nota: ${c.note || "Sin nota"}</div>
            <div>${new Date(c.created_at).toLocaleString()}</div>
            <button class="btn ghost small" data-credit-id="${c.id}">Eliminar</button>
          `;
          const btn = el.querySelector("[data-credit-id]");
          if (btn) {
            btn.addEventListener("click", async () => {
              if (!confirm("¿Eliminar recarga?")) return;
              try {
                await fetchJSON(`${API}/admin/credits/${c.id}`, {
                  method: "DELETE",
                  body: JSON.stringify({ adminId: currentUser.id }),
                });
                await loadAdmin();
              } catch (err) {
                alert(err.message);
              }
            });
          }
          creditsList.appendChild(el);
        });
      }
    }

    const commissions = await fetchJSON(
      `${API}/admin/commissions?adminId=${currentUser.id}`
    );
    adminCommissions.textContent = `Comisiones: ${commissions.total}`;

    const promoted = await fetchJSON(
      `${API}/admin/promoted?adminId=${currentUser.id}`
    );
    renderProducts(adminPromoted, promoted.products || []);
  } catch (err) {
    adminCommissions.textContent = "Comisiones: 0";
    adminPromoted.innerHTML = "<div class='item'>Error cargando admin.</div>";
  }
}


async function refreshAll() {
  await refreshUserFromServer();
  await loadPopular();
  await loadProducts();
  await loadReceipts();
  await loadAdmin();
}

loadUser();
if (currentUser) {
  refreshAll();
}

