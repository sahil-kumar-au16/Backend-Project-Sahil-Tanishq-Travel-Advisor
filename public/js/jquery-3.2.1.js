$('.add-to-cart').on('click', (e) => {
	addToCart(e.currentTarget)
  })
  
  const addToCart = (product) => {
	const productId = $(product).attr('productId');
	const isAlreadyInCart = $.grep(productsInCart, el => {return el.id == productId}).length;
  
	if (isAlreadyInCart) {
	  $.each(storageData, (i, el) => {
		if (productId == el.id) {
		  el.itemsNumber += 1;
		}
	  })
	} else {
	  const newProduct = {
		id: Number(productId),
		itemsNumber: 1
	  }
  
	  storageData.push(newProduct);
	}
  
	updateCart();
	updateProductList();
  }
  $(document).ready(() => {
	let storageData = [];
  
	$.get("product.json", (res) => {
	  productList = res;
  
	  const isStorageEmpty = Cookies.getStorage('cart').length === 0;
  
	  if (!isStorageEmpty) {
		storageData = Cookies.getStorage('cart');
	  }
  
	  updateCart();
	  buildProductList();
	  buildDropdownCart();
	  bindProductEvents();
	});
  }); 
  const updateCart = () => {
	Cookies.setStorage('cart', storageData);
	productsInCart = [];
  
	parseStorageDataWithProduct();
	updatePill();
	updateTotalAmount();
  }
  
  const parseStorageDataWithProduct = () => {
	$.each(storageData, (i, el) => {
	  const id = el.id;
	  const itemsNumber = el.itemsNumber;
  
	  $.each(productList, (i, el) => {
		if (id == el.id) {
		  el.itemsNumber = itemsNumber;
		  productsInCart.push(el)
		}
	  });
	});
  }
  
  const updatePill = () => {
	let itemsInCart = 0;
  
	$.each(productsInCart, (i, el) => {
	  itemsInCart += el.itemsNumber;
	});
  
	$('.badge-pill').html(itemsInCart);
  }
  
  const updateTotalAmount = () => {
	let total = 0;
	const shippingCost = 0;
	let summary = (total + shippingCost).toFixed(2);
  
	$.each(productsInCart, (i, el) => {
	  total += el.itemsNumber * el.price;
	});
  
	$('#total-price').html(`$${total.toFixed(2)}`);
	$('#shipping-price').html(shippingCost === 0 ? 'Free' : `$${shippingCost}`);
	$('#summary').html(`$${summary}`);
  }
  const dropdownProductsTemplate = (product) => {
	return `
	  <div id="${product.id}-dropdown" class="product row">
		<div class="col-4 px-2">
		  <div class="view zoom overlay z-depth-1 rounded mb-md-0">
			<img class="img-fluid w-100" src="${product.image}" alt="Sample">
		  </div>
		</div>
		<div class="col-5 px-2">
		  <span>${product.name}</span>
		  <p class="mb-0"><span><strong class="price">$${(product.price * product.itemsNumber).toFixed(2)}</strong></span></p>
		</div>
		<div class="col-2 pl-0 pr-2">
		  <a href="#!" type="button" class="remove-product"><i class="fas fa-trash-alt"></i></a>
		</div>
	  </div>
	  </div>
	  <hr class="mb-4">
	`
  }
  
  const productsTemplate = (product) => {
	return `
	  <div id="${product.id}" class="product row mb-4">
		<div class="col-md-5 col-lg-3 col-xl-3">
		  <div class="view zoom overlay z-depth-1 rounded mb-3 mb-md-0">
			<img class="img-fluid w-100" src="${product.image}" alt="Sample">
			<a href="#!">
			  <div class="mask waves-effect waves-light">
				<img class="img-fluid w-100" src="${product.image}">
				<div class="mask rgba-black-slight waves-effect waves-light"></div>
			  </div>
			</a>
		  </div>
		</div>
		<div class="col-md-7 col-lg-9 col-xl-9">
		  <div>
			<div class="d-flex justify-content-between">
			  <div>
				<h5>${product.name}</h5>
				<p class="mb-3 text-muted text-uppercase small">${product.category} - ${product.color}</p>
				<p class="mb-2 text-muted text-uppercase small">Color: ${product.color}</p>
				<p class="mb-3 text-muted text-uppercase small">Size: ${product.size}</p>
			  </div>
			  <div>
				<div class="def-number-input number-input safari_only mb-0 w-100">
				  <button class="minus decrease"></button>
				  <input class="quantity" min="0" name="quantity" value="${product.itemsNumber}" type="number">
				  <button class="plus increase"></button>
				</div>
				<small id="passwordHelpBlock" class="form-text text-muted text-center"> (Note, 1 piece) </small>
			  </div>
			</div>
			<div class="d-flex justify-content-between align-items-center">
			  <div>
				<a href="#!" type="button" class="remove-product card-link-secondary small text-uppercase mr-3"><i class="fas fa-trash-alt mr-1"></i> Remove item </a>
				<a href="#!" type="button" class="card-link-secondary small text-uppercase"><i class="fas fa-heart mr-1"></i> Move to wish list </a>
			  </div>
			  <p class="mb-0"><span><strong class="price">$${(product.price * product.itemsNumber).toFixed(2)}</strong></span></p>
			</div>
		  </div>
		</div>
	  </div>
	  <hr class="mb-4">
	`
  };
  const buildProductList = () => {
	$.each(productsInCart, (i, el) => {
	  const product = renderProducts(el)
	  $('#product-list').append(product);
	})
  }
  
  const buildDropdownCart = () => {
	$.each(productsInCart, (i, el) => {
	  const product = renderDropdownProducts(el);
	  $('#dropdown-cart').append(product)
	})
  }
  
  const bindProductEvents = () => {
	$('button.increase').on('click', (e) => {
	  increaseProductQuantity(e.currentTarget);
	});
  
	$('button.decrease').on('click', (e) => {
	  subtractProductQuantity(e.currentTarget);
	});
  
	$('a.remove-product').on('click', (e) => {
	  removeProduct(e.currentTarget);
	});
  }
  const increaseProductQuantity = (product) => {
	const productId = $(product).parents('.product').get(0).id
	const price = $.grep(productsInCart, el => { return el.id == productId })[0].price;
  
	$.each(storageData, (i, el) => {
	  if (el.id == productId) {
		el.itemsNumber += 1
		$(product).siblings('.quantity').val(el.itemsNumber);
		$(`#${productId}`).find('.price').html(`$${(price * el.itemsNumber).toFixed(2)}`);
		$(`#${productId}-dropdown`).find('.price').html(`$${(price * el.itemsNumber).toFixed(2)}`);
	  }
	});
  
	updateCart();
  }
  
  const subtractProductQuantity = (product) => {
	const productId = $(product).parents('.product').get(0).id
	const price = $.grep(productsInCart, el => { return el.id == productId })[0].price;
	let itemsInCart = $.grep(productsInCart, el => { return el.id == productId })[0].itemsNumber;
  
	if (itemsInCart > 0 ) {
	  storageData.map( el => {
		if (el.id == productId) {
		  el.itemsNumber -= 1
		  $(product).siblings('.quantity').val(el.itemsNumber)
		  $(`#${productId}`).find('.price').html(`$${(price * el.itemsNumber).toFixed(2)}`);
		  $(`#${productId}-dropdown`).find('.price').html(`$${(price * el.itemsNumber).toFixed(2)}`);
		}
	  });
  
	  updateCart();
	};
  }
  
  const removeProduct = (product) => {
	const productId = $(product).parents('.product').get(0).id
  
	storageData = $.grep(storageData, (el, i) => {
	  return el.id != productId
	});
  
	updateCart();
	updateProductList();
  }
  const updateProductList = () => {
	$('#product-list').empty();
	buildProductList();
	$('#dropdown-cart').empty();
	buildDropdownCart();
	bindProductEvents();
  }