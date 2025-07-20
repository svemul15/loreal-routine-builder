function renderChatHistory() {
  chatWindow.innerHTML = `<div class="chat-history">${chatHistory
    .map((msg) => {
      if (msg.role === "user") {
        return `<div class="chat-bubble user"><span class="chat-label">You</span><div class="bubble-text">${msg.content.replace(
          /\n/g,
          "<br>"
        )}</div></div>`;
      } else if (msg.role === "assistant") {
        return `<div class="chat-bubble ai"><span class="chat-label">L'Oréal AI</span><div class="bubble-text">${msg.content.replace(
          /\n/g,
          "<br>"
        )}</div></div>`;
      } else {
        return "";
      }
    })
    .join("")}</div>`;
  // Scroll to bottom (fix: use setTimeout to ensure DOM is updated)
  setTimeout(() => {
    const historyDiv = chatWindow.querySelector(".chat-history");
    if (historyDiv) historyDiv.scrollTop = historyDiv.scrollHeight;
  }, 0);
}

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Track selected products by their name */
// Load selected products from localStorage if available
let selectedProducts = [];
const savedProducts = localStorage.getItem("selectedProducts");
if (savedProducts) {
  try {
    selectedProducts = JSON.parse(savedProducts);
  } catch (e) {
    selectedProducts = [];
  }
}

// Store the full chat history for follow-up questions
let chatHistory = [];

/* Create HTML for displaying product cards with selection */
function displayProducts(products) {
  // Display product cards with info button for modal popup
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.name === product.name);
      return `
        <div class="product-card${isSelected ? " selected" : ""}" data-name="${
        product.name
      }">
          <button class="info-btn" title="Show details" tabindex="0">&#9432;</button>
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
        </div>
      `;
    })
    .join("");

  // Instant search by name only after each letter is entered
  if (window.productSearchListenerAdded !== true) {
    window.productSearchListenerAdded = true;
    const productSearch = document.getElementById("productSearch");
    productSearch.addEventListener("input", () => {
      const searchValue = productSearch.value.trim().toLowerCase();
      const selectedCategory = categoryFilter.value;
      loadProducts().then((allProducts) => {
        let filtered = allProducts;
        if (selectedCategory) {
          filtered = filtered.filter(
            (product) => product.category === selectedCategory
          );
        }
        if (searchValue) {
          filtered = filtered.filter((product) =>
            product.name.toLowerCase().includes(searchValue)
          );
        }
        displayProducts(filtered);
        updateSelectedProducts();
      });
    });
  }

  // Add click event listeners for selection
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent click if info button is clicked
      if (e.target.classList.contains("info-btn")) return;
      const name = card.getAttribute("data-name");
      const product = products.find((p) => p.name === name);
      const alreadySelected = selectedProducts.some((p) => p.name === name);
      if (alreadySelected) {
        selectedProducts = selectedProducts.filter((p) => p.name !== name);
      } else {
        selectedProducts.push(product);
      }
      // Save to localStorage
      localStorage.setItem(
        "selectedProducts",
        JSON.stringify(selectedProducts)
      );
      displayProducts(products);
      updateSelectedProducts();
    });
  });

  // Add click event listeners for info buttons
  document.querySelectorAll(".info-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card selection
      const card = btn.closest(".product-card");
      const name = card.getAttribute("data-name");
      const product = products.find((p) => p.name === name);
      showProductModal(product);
    });
  });
}
/* Show product details in a modal popup */
function showProductModal(product) {
  // Remove any existing modal
  const oldModal = document.getElementById("productModal");
  if (oldModal) oldModal.remove();

  // Create modal HTML
  const modal = document.createElement("div");
  modal.id = "productModal";
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content" tabindex="0">
      <button class="close-modal" title="Close">&times;</button>
      <h2>${product.name}</h2>
      <p><strong>Brand:</strong> ${product.brand}</p>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Description:</strong> ${product.description}</p>
    </div>
  `;
  document.body.appendChild(modal);

  // Focus modal for accessibility
  modal.querySelector(".modal-content").focus();

  // Close modal on button click or overlay click
  modal
    .querySelector(".close-modal")
    .addEventListener("click", () => modal.remove());
  modal
    .querySelector(".modal-overlay")
    .addEventListener("click", () => modal.remove());

  // Close modal on Escape key
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.remove();
  });
}
/* Add styles for info button and modal popup */
const modalStyle = document.createElement("style");
modalStyle.innerHTML = `
  .info-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #fffbe8;
    color: #ff003b;
    border: 1.5px solid #e3a535;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(227,165,53,0.08);
    transition: background 0.2s, color 0.2s;
    z-index: 3;
  }
  .info-btn:hover, .info-btn:focus {
    background: #ffe3e3;
    color: #e3a535;
    outline: none;
  }
  .product-card {
    position: relative;
  }
  #productModal {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(34, 34, 34, 0.35);
    z-index: 0;
  }
  .modal-content {
    position: relative;
    background: linear-gradient(120deg, #fffbe8 80%, #ffe3e3 100%);
    border-radius: 18px;
    box-shadow: 0 8px 32px rgba(255,0,59,0.13);
    padding: 32px 28px 24px 28px;
    min-width: 320px;
    max-width: 90vw;
    color: #c72c2c;
    font-family: "Montserrat", Arial, Helvetica, sans-serif;
    z-index: 1;
    outline: none;
  }
  .modal-content h2 {
    font-size: 22px;
    color: #ff003b;
    margin-bottom: 12px;
    font-weight: 700;
  }
  .modal-content p {
    font-size: 16px;
    margin-bottom: 8px;
    color: #e3a535;
  }
  .close-modal {
    position: absolute;
    top: 12px;
    right: 18px;
    background: none;
    border: none;
    font-size: 28px;
    color: #ff003b;
    cursor: pointer;
    font-weight: bold;
    transition: color 0.2s;
  }
  .close-modal:hover, .close-modal:focus {
    color: #e3a535;
    outline: none;
  }
`;
document.head.appendChild(modalStyle);

/* Update the Selected Products section */
function updateSelectedProducts() {
  const selectedList = document.getElementById("selectedProductsList");
  if (selectedProducts.length === 0) {
    selectedList.innerHTML = `<div class="placeholder-message">No products selected</div>`;
    // Remove from localStorage
    localStorage.removeItem("selectedProducts");
    // Remove clear button if present
    const clearBtn = document.getElementById("clearSelectionsBtn");
    if (clearBtn) clearBtn.remove();
    return;
  }
  selectedList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product-item">
          <img src="${product.image}" alt="${product.name}" width="40" height="40">
          <span>${product.name}</span>
          <button class="remove-btn" data-name="${product.name}" title="Remove">&times;</button>
        </div>
      `
    )
    .join("");

  // Add clear all button if not present
  if (!document.getElementById("clearSelectionsBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectionsBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.className = "generate-btn";
    clearBtn.style.marginTop = "12px";
    clearBtn.style.background = "#ffe3e3";
    clearBtn.style.color = "#c72c2c";
    clearBtn.style.border = "1.5px solid #ff003b";
    clearBtn.style.fontSize = "16px";
    clearBtn.style.fontWeight = "600";
    clearBtn.style.borderRadius = "18px";
    clearBtn.style.boxShadow = "0 2px 8px rgba(255,0,59,0.08)";
    clearBtn.style.cursor = "pointer";
    clearBtn.addEventListener("click", () => {
      selectedProducts = [];
      localStorage.removeItem("selectedProducts");
      updateSelectedProducts();
      loadProducts().then((products) => {
        displayProducts(
          products.filter(
            (product) => product.category === categoryFilter.value
          )
        );
      });
    });
    selectedList.parentElement.appendChild(clearBtn);
  }

  // Remove product from selected list
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-name");
      selectedProducts = selectedProducts.filter((p) => p.name !== name);
      // Save to localStorage
      localStorage.setItem(
        "selectedProducts",
        JSON.stringify(selectedProducts)
      );
      // Re-display products and update list
      loadProducts().then((products) => {
        displayProducts(
          products.filter(
            (product) => product.category === categoryFilter.value
          )
        );
      });
      updateSelectedProducts();
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );
  displayProducts(filteredProducts);
  updateSelectedProducts();
});

/* Chat form submission handler - placeholder for OpenAI integration */
/* Chat form submission handler for follow-up questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInputElem = document.getElementById("userInput");
  const userInput = userInputElem.value.trim();
  if (!userInput) return;

  // Clear input immediately so text disappears as soon as submitted
  userInputElem.value = "";

  // Add user's question to chat history
  chatHistory.push({ role: "user", content: userInput });

  // Show chat history with loading message
  renderChatHistory();
  chatWindow.innerHTML += `<div class='placeholder-message'>Thinking...</div>`;

  // Add a system prompt to instruct the AI to only answer relevant questions
  const systemPrompt = {
    role: "system",
    content:
      "You are a helpful beauty advisor for L'Oréal. Only answer questions related to L'Oréal, the generated routine, skincare, haircare, makeup, fragrance, and other beauty-related topics. If a user asks something irrelevant, kindly decline and say you can assist with L'Oréal or beauty/routine related questions.",
  };
  // Build messages array: always start with system prompt
  const messagesToSend = [systemPrompt, ...chatHistory];

  try {
    const response = await fetch(
      "https://loreal-routine.saranya-sai157.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: messagesToSend,
          max_tokens: 400,
        }),
      }
    );
    const data = await response.json();
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      renderChatHistory();
    } else {
      chatWindow.innerHTML = `<div class=\"placeholder-message\">Sorry, no response. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML = `<div class=\"placeholder-message\">Error. Please try again.</div>`;
  }
});

/* Generate Routine button functionality */
const generateRoutineBtn = document.getElementById("generateRoutine");
generateRoutineBtn.addEventListener("click", async () => {
  // 1. Collect selected products (name, brand, category, description)
  const productsToSend = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  // 2. Prepare initial messages for OpenAI API (gpt-4o)
  chatHistory = [
    {
      role: "system",
      content:
        "You are a helpful beauty advisor. Create a personalized routine using only the provided products. Answer follow-up questions about the routine or beauty topics like skincare, haircare, makeup, fragrance, etc.",
    },
  ];
  // Do NOT add the user's initial request to chatHistory

  // 3. Show only 'Generating routine...' in chat
  chatWindow.innerHTML = `<div class='placeholder-message'>Generating routine...</div>`;

  // 4. Send request to worker URL (no API key needed)
  try {
    const response = await fetch(
      "https://loreal-routine.saranya-sai157.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful beauty advisor. Create a personalized routine using only the provided products. Answer follow-up questions about the routine or beauty topics like skincare, haircare, makeup, fragrance, etc.",
            },
            {
              role: "user",
              content: `Here are my selected products: ${JSON.stringify(
                productsToSend,
                null,
                2
              )}. Please generate a step-by-step routine for me.`,
            },
          ],
          max_tokens: 400,
        }),
      }
    );
    const data = await response.json();
    // 5. Display the AI-generated routine in the chat window
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      renderChatHistory();
    } else {
      chatWindow.innerHTML = `<div class="placeholder-message">Sorry, no routine was generated. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML = `<div class="placeholder-message">Error generating routine. Please try again.</div>`;
  }
});

/* Add styles for selected product cards and selected product items */
const style = document.createElement("style");
style.innerHTML = `
  .chat-history {
    max-height: 250px;
    overflow-y: auto;
    padding: 12px 0;
    background: #f8f8f8;
    border-radius: 10px;
    border: 1px solid #e3a535;
    margin-bottom: 10px;
    font-size: 16px;
  }
  .chat-message {
    margin-bottom: 10px;
    padding: 8px 14px;
    border-radius: 10px;
    word-break: break-word;
    max-width: 90%;
    display: flex;
    flex-direction: column;
  }
  .chat-message.user {
    background: #ffe3e3;
    color: #c72c2c;
    align-self: flex-end;
    border: 1.5px solid #ff003b;
  }
  .chat-message.ai {
    background: #fffbe8;
    color: #e3a535;
    align-self: flex-start;
    border: 1.5px solid #e3a535;
  }
  .chat-label {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 2px;
    opacity: 0.7;
    letter-spacing: 0.5px;
  }
  .product-card.selected {
    border: 2.5px solid #ff003b;
    box-shadow: 0 0 0 4px #ffe3e3;
    background: #fffbe8;
    position: relative;
  }
  .selected-product-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 1.5px solid #e3a535;
    border-radius: 8px;
    padding: 6px 12px;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(227,165,53,0.06);
  }
  .selected-product-item img {
    border-radius: 6px;
    background: #fffbe8;
    border: 1px solid #e3a535;
  }
  .selected-product-item .remove-btn {
    background: #ff003b;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    font-size: 18px;
    cursor: pointer;
    margin-left: 8px;
    transition: background 0.2s;
  }
  .selected-product-item .remove-btn:hover {
    background: #e3a535;
    color: #fff;
  }
`;
document.head.appendChild(style);
