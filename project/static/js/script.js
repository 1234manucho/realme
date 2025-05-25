document.addEventListener('DOMContentLoaded', function() {
  // Header scroll effect
  const header = document.querySelector('header');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  // Handle scroll effect on header
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // Mobile menu toggle
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
  }
  
  // Close flash messages
  const closeButtons = document.querySelectorAll('.alert-close');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const alert = this.parentElement;
      alert.style.opacity = '0';
      setTimeout(() => {
        alert.remove();
      }, 300);
    });
  });
  
  // Auto-close flash messages after 5 seconds
  const flashMessages = document.querySelectorAll('.alert');
  flashMessages.forEach(message => {
    setTimeout(() => {
      message.style.opacity = '0';
      setTimeout(() => {
        message.remove();
      }, 300);
    }, 5000);
  });
  
  // Form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('invalid');
          
          // Add error message if doesn't exist
          let errorMsg = field.nextElementSibling;
          if (!errorMsg || !errorMsg.classList.contains('error-message')) {
            errorMsg = document.createElement('div');
            errorMsg.classList.add('error-message');
            errorMsg.style.color = 'var(--error-color)';
            errorMsg.style.fontSize = '12px';
            errorMsg.style.marginTop = '4px';
            errorMsg.textContent = 'This field is required';
            field.parentNode.insertBefore(errorMsg, field.nextSibling);
          }
        } else {
          field.classList.remove('invalid');
          const errorMsg = field.nextElementSibling;
          if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.remove();
          }
        }
      });
      
      if (!isValid) {
        e.preventDefault();
      }
    });
    
    // Live validation on input
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', function() {
        if (this.hasAttribute('required') && this.value.trim()) {
          this.classList.remove('invalid');
          const errorMsg = this.nextElementSibling;
          if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.remove();
          }
        }
      });
    });
  });
  
  // Admin dashboard tab switching
  const adminTabs = document.querySelectorAll('.admin-tab');
  const adminContents = document.querySelectorAll('.admin-content-section');
  
  if (adminTabs.length > 0) {
    adminTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        
        // Update active tab
        adminTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Show target content
        adminContents.forEach(content => {
          if (content.id === target) {
            content.style.display = 'block';
          } else {
            content.style.display = 'none';
          }
        });
      });
    });
  }
  
  // Project filter in projects page
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');
        
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Filter projects
        projectCards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
  
  // Smooth scroll for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const headerHeight = header.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Close mobile menu if open
        if (navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          document.body.classList.remove('menu-open');
        }
      }
    });
  });
  
  // Animation on scroll
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  function checkIfInView() {
    const windowHeight = window.innerHeight;
    const windowTopPosition = window.scrollY;
    const windowBottomPosition = windowTopPosition + windowHeight;
    
    animatedElements.forEach(element => {
      const elementHeight = element.offsetHeight;
      const elementTopPosition = element.offsetTop;
      const elementBottomPosition = elementTopPosition + elementHeight;
      
      // Check if element is in viewport
      if (
        (elementBottomPosition >= windowTopPosition && elementTopPosition <= windowBottomPosition)
      ) {
        element.classList.add('animated');
      }
    });
  }
  
  // Run on load and scroll
  window.addEventListener('scroll', checkIfInView);
  window.addEventListener('resize', checkIfInView);
  window.addEventListener('load', checkIfInView);
  
  // Lazy load images
  const lazyImages = document.querySelectorAll('.lazy-image');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-image');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy-image');
    });
  }
  
  // Initialize admin data fetching if on admin page
  if (document.querySelector('.admin-container')) {
    fetchAdminData();
  }
});

// Function to fetch admin data via API
function fetchAdminData() {
  // Fetch messages for admin dashboard
  fetch('/api/messages')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      updateMessagesTable(data);
    })
    .catch(error => {
      console.error('Error fetching messages:', error);
    });
}

// Update messages table in admin dashboard
function updateMessagesTable(messages) {
  const tableBody = document.querySelector('#messages-table tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (messages.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" class="text-center">No messages found</td>';
    tableBody.appendChild(row);
    return;
  }
  
  messages.forEach(message => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${message.name}</td>
      <td>${message.email}</td>
      <td>${message.subject}</td>
      <td>${formatDate(message.date_posted)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-primary view-message-btn" data-id="${message.id}" data-message="${encodeURIComponent(message.message)}">View</button>
          <button class="btn btn-sm btn-delete delete-message-btn" data-id="${message.id}">Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  // Add event listeners to new buttons
  document.querySelectorAll('.view-message-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const message = decodeURIComponent(this.getAttribute('data-message'));
      showMessageModal(message);
    });
  });
  
  document.querySelectorAll('.delete-message-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this message?')) {
        deleteMessage(id);
      }
    });
  });
}

// Show message modal
function showMessageModal(message) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('message-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'message-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h3>Message</h3>
        <div class="modal-body">
          <p id="modal-message-text"></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add close functionality
    modal.querySelector('.modal-close').addEventListener('click', function() {
      modal.style.display = 'none';
    });
    
    // Close when clicking outside
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Update message and show modal
  document.getElementById('modal-message-text').textContent = message;
  modal.style.display = 'block';
}

// Delete message
function deleteMessage(id) {
  fetch(`/api/messages/${id}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Refresh messages list
      fetchAdminData();
      
      // Show success message
      const flashContainer = document.querySelector('.flash-messages');
      if (flashContainer) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `
          Message deleted successfully
          <span class="alert-close">&times;</span>
        `;
        flashContainer.appendChild(alert);
        
        // Add close functionality
        alert.querySelector('.alert-close').addEventListener('click', function() {
          alert.style.opacity = '0';
          setTimeout(() => {
            alert.remove();
          }, 300);
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          alert.style.opacity = '0';
          setTimeout(() => {
            alert.remove();
          }, 300);
        }, 5000);
      }
    })
    .catch(error => {
      console.error('Error deleting message:', error);
    });
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}