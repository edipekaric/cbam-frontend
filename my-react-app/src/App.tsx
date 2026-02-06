import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import Login from './Login';
import Dashboard from './Dashboard';
import NewCalculation from './NewCalculation';
import CalculationsList from './CalculationsList';
import Admin from './Admin';
import ProtectedRoute from './ProtectedRoute';
import {
  TrendingDown,
  Shield,
  Language,
  KeyboardArrowDown,
  ArrowForward,
  Calculate,
  Description,
  Send,
  CheckCircle,
} from '@mui/icons-material';
import { API_BASE_URL } from './utils/api';

type Language = 'en' | 'ju' | 'tr';

interface Translations {
  nav: {
    features: string;
    howItWorks: string;
    about: string;
    login: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    scheduleDemo: string;
    learnMore: string;
  };
  features: {
    title: string;
    subtitle: string;
    cards: {
      calculate: {
        title: string;
        description: string;
      };
      reports: {
        title: string;
        description: string;
      };
      sharing: {
        title: string;
        description: string;
      };
    };
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: {
      input: {
        title: string;
        description: string;
      };
      calculate: {
        title: string;
        description: string;
      };
      share: {
        title: string;
        description: string;
      };
    };
  };
  benefits: {
    title: string;
    items: {
      compliant: {
        title: string;
        description: string;
      };
      saveTime: {
        title: string;
        description: string;
      };
      reduceErrors: {
        title: string;
        description: string;
      };
      buildTrust: {
        title: string;
        description: string;
      };
    };
    stats: {
      companies: string;
      accuracy: string;
    };
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  footer: {
    tagline: string;
    product: {
      title: string;
      features: string;
      pricing: string;
      documentation: string;
    };
    resources: {
      title: string;
      guide: string;
      blog: string;
      support: string;
    };
    company: {
      title: string;
      about: string;
      contact: string;
      privacy: string;
    };
    copyright: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      features: 'Features',
      howItWorks: 'How It Works',
      about: 'About CBAM',
      login: 'Login'
    },
    hero: {
      badge: 'EU CBAM Compliant',
      title: 'Simplify Your ',
      titleHighlight: 'CBAM Emissions',
      subtitle: 'Calculate product emissions accurately, generate compliant reports, and seamlessly share them with your EU clients. All in one platform.',
      scheduleDemo: 'Schedule a Demo',
      learnMore: 'Learn More'
    },
    features: {
      title: 'Everything You Need for CBAM Compliance',
      subtitle: 'Streamline your carbon reporting workflow with our comprehensive solution',
      cards: {
        calculate: {
          title: 'Accurate Calculations',
          description: 'Calculate embedded emissions using official CBAM methodologies and emission factors for all covered sectors.'
        },
        reports: {
          title: 'Compliant Reports',
          description: 'Generate standardized reports that meet EU requirements, ready for submission by your clients.'
        },
        sharing: {
          title: 'Easy Sharing',
          description: 'Send emissions data directly to your EU clients with secure, trackable delivery.'
        }
      }
    },
    howItWorks: {
      title: 'How It Works',
      subtitle: 'Three simple steps to complete CBAM compliance',
      steps: {
        input: {
          title: 'Input Product Data',
          description: 'Enter your product specifications, production methods, and energy consumption data into our intuitive calculator.'
        },
        calculate: {
          title: 'Calculate Emissions',
          description: 'Our system automatically calculates embedded emissions using verified methodologies and official emission factors.'
        },
        share: {
          title: 'Share with Clients',
          description: 'Generate compliant reports and send them directly to your EU clients through our secure platform.'
        }
      }
    },
    benefits: {
      title: 'Why Choose EPE Consulting?',
      items: {
        compliant: {
          title: 'Stay Compliant',
          description: 'Keep up with evolving EU CBAM regulations automatically'
        },
        saveTime: {
          title: 'Save Time',
          description: 'Reduce reporting time from days to minutes'
        },
        reduceErrors: {
          title: 'Reduce Errors',
          description: 'Eliminate manual calculation mistakes with automated processes'
        },
        buildTrust: {
          title: 'Build Trust',
          description: 'Provide transparent, verified emissions data to your clients'
        }
      },
      stats: {
        companies: 'Companies already compliant',
        accuracy: 'Calculation accuracy rate'
      }
    },
    cta: {
      title: 'Ready to Streamline Your CBAM Reporting?',
      subtitle: 'Join thousands of companies making carbon reporting simple and accurate',
      button: 'Schedule a Demo'
    },
    footer: {
      tagline: 'Making CBAM compliance simple for businesses worldwide.',
      product: {
        title: 'Product',
        features: 'Features',
        pricing: 'Pricing',
        documentation: 'Documentation'
      },
      resources: {
        title: 'Resources',
        guide: 'CBAM Guide',
        blog: 'Blog',
        support: 'Support'
      },
      company: {
        title: 'Company',
        about: 'About',
        contact: 'Contact',
        privacy: 'Privacy'
      },
      copyright: '© 2025 EPE Consulting. All rights reserved.'
    }
  },
  ju: {
    nav: {
      features: 'Mogućnosti',
      howItWorks: 'Kako Funkcionira',
      about: 'O CBAM-u',
      login: 'Prijava'
    },
    hero: {
      badge: 'EU CBAM Usklađeno',
      title: 'Pojednostavite Vaše ',
      titleHighlight: 'CBAM Izvješćivanje',
      subtitle: 'Precizno izračunajte emisije proizvoda, generirajte usklađena izvješća i jednostavno ih podijelite sa svojim EU klijentima. Sve na jednoj platformi.',
      scheduleDemo: 'Zakažite Demo',
      learnMore: 'Saznajte Više'
    },
    features: {
      title: 'Sve Što Vam Treba za CBAM Usklađenost',
      subtitle: 'Pojednostavite proces izvješćivanja o ugljičnom otisku našim sveobuhvatnim rješenjem',
      cards: {
        calculate: {
          title: 'Precizni Izračuni',
          description: 'Izračunajte ugrađene emisije koristeći službene CBAM metodologije i faktore emisija za sve pokrivene sektore.'
        },
        reports: {
          title: 'Usklađena Izvješća',
          description: 'Generirajte standardizirana izvješća koja ispunjavaju EU zahtjeve, spremna za podnošenje od strane vaših klijenata.'
        },
        sharing: {
          title: 'Jednostavno Dijeljenje',
          description: 'Pošaljite podatke o emisijama izravno vašim EU klijentima sa sigurnom, pratljivom dostavom.'
        }
      }
    },
    howItWorks: {
      title: 'Kako Funkcionira',
      subtitle: 'Tri jednostavna koraka do CBAM usklađenosti',
      steps: {
        input: {
          title: 'Unesite Podatke o Proizvodu',
          description: 'Unesite specifikacije proizvoda, metode proizvodnje i podatke o potrošnji energije u naš intuitivni kalkulator.'
        },
        calculate: {
          title: 'Izračunajte Emisije',
          description: 'Naš sustav automatski izračunava ugrađene emisije koristeći verificirane metodologije i službene faktore emisija.'
        },
        share: {
          title: 'Podijelite s Klijentima',
          description: 'Generirajte usklađena izvješća i pošaljite ih izravno vašim EU klijentima kroz našu sigurnu platformu.'
        }
      }
    },
    benefits: {
      title: 'Zašto Odabrati EPE Consulting?',
      items: {
        compliant: {
          title: 'Ostanite Usklađeni',
          description: 'Pratite promjene EU CBAM regulativa automatski'
        },
        saveTime: {
          title: 'Uštedite Vrijeme',
          description: 'Smanjite vrijeme izvješćivanja s dana na minute'
        },
        reduceErrors: {
          title: 'Smanjite Greške',
          description: 'Eliminirajte greške u ručnim izračunima automatiziranim procesima'
        },
        buildTrust: {
          title: 'Izgradite Povjerenje',
          description: 'Pružite transparentne, verificirane podatke o emisijama vašim klijentima'
        }
      },
      stats: {
        companies: 'Tvrtki već usklađeno',
        accuracy: 'Stopa točnosti izračuna'
      }
    },
    cta: {
      title: 'Spremni Pojednostaviti Vaše CBAM Izvješćivanje?',
      subtitle: 'Pridružite se tisućama tvrtki koje čine izvješćivanje o ugljiku jednostavnim i točnim',
      button: 'Zakažite Demo'
    },
    footer: {
      tagline: 'Činimo CBAM usklađenost jednostavnom za tvrtke širom svijeta.',
      product: {
        title: 'Proizvod',
        features: 'Mogućnosti',
        pricing: 'Cijene',
        documentation: 'Dokumentacija'
      },
      resources: {
        title: 'Resursi',
        guide: 'CBAM Vodič',
        blog: 'Blog',
        support: 'Podrška'
      },
      company: {
        title: 'Tvrtka',
        about: 'O Nama',
        contact: 'Kontakt',
        privacy: 'Privatnost'
      },
      copyright: '© 2025 EPE Consulting. Sva prava pridržana.'
    }
  },
  tr: {
    nav: {
      features: 'Özellikler',
      howItWorks: 'Nasıl Çalışır',
      about: 'CBAM Hakkında',
      login: 'Giriş'
    },
    hero: {
      badge: 'AB CBAM Uyumlu',
      title: 'CBAM ',
      titleHighlight: 'Raporlamanızı',
      subtitle: 'Ürün emisyonlarınızı hesaplayın, uyumlu raporlar oluşturun ve AB müşterilerinizle güvenle paylaşın. Hepsi tek platformda.',
      scheduleDemo: 'Demo Planla',
      learnMore: 'Daha Fazla Bilgi'
    },
    features: {
      title: 'CBAM Uyumu İçin İhtiyacınız Olan Her Şey',
      subtitle: 'Kapsamlı çözümümüzle karbon ayak izi raporlamasını kolaylaştırın',
      cards: {
        calculate: {
          title: 'Hassas Hesaplamalar',
          description: 'Tüm kapsanan sektörler için resmi CBAM metodolojileri ve emisyon faktörleri kullanarak gömülü emisyonları hesaplayın.'
        },
        reports: {
          title: 'Uyumlu Raporlar',
          description: 'AB gereksinimlerini karşılayan, müşterileriniz tarafından sunulmaya hazır standart raporlar oluşturun.'
        },
        sharing: {
          title: 'Kolay Paylaşım',
          description: 'Emisyon verilerini güvenli, izlenebilir teslimatla doğrudan AB müşterilerinize iletin.'
        }
      }
    },
    howItWorks: {
      title: 'Nasıl Çalışır',
      subtitle: 'CBAM uyumluluğuna üç basit adım',
      steps: {
        input: {
          title: 'Ürün Verilerini Girin',
          description: 'Ürün özelliklerini, üretim yöntemlerini ve enerji tüketim verilerini sezgisel hesap makinemize girin.'
        },
        calculate: {
          title: 'Emisyonları Hesaplayın',
          description: 'Sistemimiz doğrulanmış metodolojiler ve resmi emisyon faktörleri kullanarak gömülü emisyonları otomatik hesaplar.'
        },
        share: {
          title: 'Müşterilerle Paylaşın',
          description: 'Uyumlu raporlar oluşturun ve güvenli platformumuz aracılığıyla doğrudan AB müşterilerinize gönderin.'
        }
      }
    },
    benefits: {
      title: 'Neden EPE Consulting?',
      items: {
        compliant: {
          title: 'Uyumlu Kalın',
          description: 'AB CBAM düzenlemelerindeki değişiklikleri otomatik takip edin'
        },
        saveTime: {
          title: 'Zaman Kazanın',
          description: 'Raporlama süresini günlerden dakikalara indirin'
        },
        reduceErrors: {
          title: 'Hataları Azaltın',
          description: 'Otomatik süreçlerle manuel hesaplama hatalarını ortadan kaldırın'
        },
        buildTrust: {
          title: 'Güven Oluşturun',
          description: 'Müşterilerinize şeffaf, doğrulanmış emisyon verileri sunun'
        }
      },
      stats: {
        companies: 'Zaten uyumlu şirket',
        accuracy: 'Hesaplama doğruluğu'
      }
    },
    cta: {
      title: 'CBAM Raporlamanızı Kolaylaştırmaya Hazır mısınız?',
      subtitle: 'Karbon raporlamasını basit ve doğru yapan binlerce şirkete katılın',
      button: 'Demo Planla'
    },
    footer: {
      tagline: 'CBAM uyumluluğunu dünya genelinde şirketler için basit hale getiriyoruz.',
      product: {
        title: 'Ürün',
        features: 'Özellikler',
        pricing: 'Fiyatlandırma',
        documentation: 'Dokümantasyon'
      },
      resources: {
        title: 'Kaynaklar',
        guide: 'CBAM Rehberi',
        blog: 'Blog',
        support: 'Destek'
      },
      company: {
        title: 'Şirket',
        about: 'Hakkımızda',
        contact: 'İletişim',
        privacy: 'Gizlilik'
      },
      copyright: '© 2025 EPE Consulting. Tüm hakları saklıdır.'
    }
  }
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface StepProps {
  number: number;
  title: string;
  description: string;
}

interface BenefitProps {
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}15, white)`,
        border: `1px solid ${color}30`,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Avatar sx={{ bgcolor: color, mb: 2, width: 48, height: 48 }}>
          {icon}
        </Avatar>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Step: React.FC<StepProps> = ({ number, title, description }) => {
  return (
    <Box textAlign="center">
      <Avatar 
        sx={{ 
          bgcolor: 'primary.main', 
          width: 64, 
          height: 64, 
          mx: 'auto', 
          mb: 2,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}
      >
        {number}
      </Avatar>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
};

const Benefit: React.FC<BenefitProps> = ({ title, description }) => {
  return (
    <Box display="flex" alignItems="flex-start" gap={2}>
      <CheckCircle color="primary" sx={{ mt: 0.5, flexShrink: 0 }} />
      <Box>
        <Typography variant="h6" component="h4" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

const CBAMLandingPage: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const t = translations[language];

  const languageOptions = [
    { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
    { code: 'ju' as Language, label: 'Bosanski', flag: '🇧🇦' },
    { code: 'tr' as Language, label: 'Türkçe', flag: '🇹🇷' }
  ];

  const currentLanguage = languageOptions.find(lang => lang.code === language);

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setAnchorEl(null);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleOpenDemoDialog = () => setDemoDialogOpen(true);
  const handleCloseDemoDialog = () => {
    setDemoDialogOpen(false);
    setDemoError(null);
    if (demoSuccess) {
      setDemoName('');
      setDemoEmail('');
      setDemoCompany('');
      setDemoMessage('');
      setDemoSuccess(false);
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError(null);
    setDemoLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoName.trim(),
          email: demoEmail.trim(),
          company: demoCompany.trim() || undefined,
          message: demoMessage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDemoError(data?.message || 'Something went wrong. Please try again.');
        setDemoLoading(false);
        return;
      }
      setDemoSuccess(true);
      setDemoLoading(false);
      setTimeout(() => {
        setDemoDialogOpen(false);
        setDemoSuccess(false);
        setDemoName('');
        setDemoEmail('');
        setDemoCompany('');
        setDemoMessage('');
      }, 2000);
    } catch {
      setDemoError('Unable to send request. Please try again.');
      setDemoLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <AppBar 
        position="fixed" 
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1 }}>
            <TrendingDown color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              EPE Consulting
            </Typography>
          </Box>
          
          {!isMobile && (
            <Box display="flex" gap={4} sx={{ mr: 4 }}>
              <Button color="inherit" href="#features">
                {t.nav.features}
              </Button>
              <Button color="inherit" href="#how-it-works">
                {t.nav.howItWorks}
              </Button>
              <Button color="inherit" href="#about">
                {t.nav.about}
              </Button>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={2}>
            <Button
              onClick={handleLanguageClick}
              startIcon={<Language />}
              endIcon={<KeyboardArrowDown />}
              sx={{ color: 'text.secondary' }}
            >
              {currentLanguage?.label}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleLanguageClose}
            >
              {languageOptions.map((lang) => (
                <MenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  selected={language === lang.code}
                >
                  <ListItemIcon>
                    <Typography>{lang.flag}</Typography>
                  </ListItemIcon>
                  <ListItemText>{lang.label}</ListItemText>
                  {language === lang.code && <CheckCircle color="primary" />}
                </MenuItem>
              ))}
            </Menu>
            <Button variant="contained" color="primary" onClick={handleLoginClick}>
              {t.nav.login}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ pt: 16, pb: 10, px: { xs: 2, sm: 4 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" maxWidth="md" mx="auto">
            <Chip
              icon={<Shield />}
              label={t.hero.badge}
              color="primary"
              variant="outlined"
              sx={{ mb: 3, bgcolor: 'primary.50', color: 'primary.main' }}
            />
            <Typography 
              variant="h1" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.75rem' },
                fontWeight: 700,
                lineHeight: 1.2
              }}
            >
              {t.hero.title}
              <Typography 
                component="span" 
                color="primary" 
                sx={{ 
                  fontSize: 'inherit',
                  fontWeight: 'inherit'
                }}
              >
                {t.hero.titleHighlight}
              </Typography>
              {' '}Reporting
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ mb: 4, lineHeight: 1.6 }}
            >
              {t.hero.subtitle}
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={handleOpenDemoDialog}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: 3
                }}
              >
                {t.hero.scheduleDemo}
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                {t.hero.learnMore}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="h2" component="h2" gutterBottom>
              {t.features.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 'md', mx: 'auto' }}>
              {t.features.subtitle}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FeatureCard
                icon={<Calculate />}
                title={t.features.cards.calculate.title}
                description={t.features.cards.calculate.description}
                color="#059669"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FeatureCard
                icon={<Description />}
                title={t.features.cards.reports.title}
                description={t.features.cards.reports.description}
                color="#2563eb"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FeatureCard
                icon={<Send />}
                title={t.features.cards.sharing.title}
                description={t.features.cards.sharing.description}
                color="#7c3aed"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box id="how-it-works" sx={{ py: 10, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="h2" component="h2" gutterBottom>
              {t.howItWorks.title}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {t.howItWorks.subtitle}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Step 
                number={1} 
                title={t.howItWorks.steps.input.title} 
                description={t.howItWorks.steps.input.description} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Step 
                number={2} 
                title={t.howItWorks.steps.calculate.title} 
                description={t.howItWorks.steps.calculate.description} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Step 
                number={3} 
                title={t.howItWorks.steps.share.title} 
                description={t.howItWorks.steps.share.description} 
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" component="h2" gutterBottom>
                {t.benefits.title}
              </Typography>
              <Stack spacing={3} sx={{ mt: 4 }}>
                <Benefit 
                  title={t.benefits.items.compliant.title} 
                  description={t.benefits.items.compliant.description} 
                />
                <Benefit 
                  title={t.benefits.items.saveTime.title} 
                  description={t.benefits.items.saveTime.description} 
                />
                <Benefit 
                  title={t.benefits.items.reduceErrors.title} 
                  description={t.benefits.items.reduceErrors.description} 
                />
                <Benefit 
                  title={t.benefits.items.buildTrust.title} 
                  description={t.benefits.items.buildTrust.description} 
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 4, 
                  background: 'linear-gradient(135deg, #d1fae5, #dbeafe)',
                  borderRadius: 3
                }}
              >
                <Box textAlign="center">
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    2,500+
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {t.benefits.stats.companies}
                  </Typography>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h3" component="div" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                    99.8%
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t.benefits.stats.accuracy}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 10, bgcolor: 'primary.main', color: 'white' }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h2" component="h2" gutterBottom sx={{ color: 'white' }}>
              {t.cta.title}
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: 'primary.light' }}>
              {t.cta.subtitle}
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleOpenDemoDialog}
              sx={{ 
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'grey.100',
                }
              }}
            >
              {t.cta.button}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'grey.300', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                <TrendingDown color="primary" />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  EPE Consulting
                </Typography>
              </Box>
              <Typography variant="body2">
                {t.footer.tagline}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                {t.footer.product.title}
              </Typography>
              <Stack spacing={1}>
                <Button color="inherit" size="small">
                  {t.footer.product.features}
                </Button>
                <Button color="inherit" size="small">
                  {t.footer.product.pricing}
                </Button>
                <Button color="inherit" size="small">
                  {t.footer.product.documentation}
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                {t.footer.resources.title}
              </Typography>
              <Stack spacing={1}>
                <Button color="inherit" size="small">
                  {t.footer.resources.guide}
                </Button>
                <Button color="inherit" size="small">
                  {t.footer.resources.blog}
                </Button>
                <Button color="inherit" size="small">
                  {t.footer.resources.support}
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                {t.footer.company.title}
              </Typography>
              <Stack spacing={1}>
                <Button color="inherit" size="small">
                  {t.footer.company.about}
                </Button>
                <Button color="inherit" size="small">
                  {t.footer.company.contact}
                </Button>
                <Button color="inherit" size="small">
                  {t.footer.company.privacy}
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: 1, borderColor: 'grey.800', pt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              {t.footer.copyright}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Schedule Demo Dialog */}
      <Dialog open={demoDialogOpen} onClose={handleCloseDemoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule a Demo</DialogTitle>
        <form onSubmit={handleDemoSubmit}>
          <DialogContent>
            {demoError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDemoError(null)}>
                {demoError}
              </Alert>
            )}
            {demoSuccess ? (
              <Alert severity="success">Thank you! We&apos;ll be in touch soon.</Alert>
            ) : (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  required
                  label="Name"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  fullWidth
                  autoFocus
                />
                <TextField
                  required
                  label="Email"
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Company"
                  value={demoCompany}
                  onChange={(e) => setDemoCompany(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Message"
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Stack>
            )}
          </DialogContent>
          {!demoSuccess && (
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseDemoDialog} disabled={demoLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={demoLoading}>
                {demoLoading ? <CircularProgress size={24} /> : 'Submit'}
              </Button>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </Box>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    // Clear localStorage on logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/" element={<CBAMLandingPage />} />
      <Route path="/admin" element={<Admin />} />
      <Route 
        path="/login" 
        element={<Login onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route path="calculations" element={<CalculationsList />} />
        {/* Single URL for wizard: new (no id) creates then redirects; edit has calculationId in path */}
        <Route path="new-calculation" element={<NewCalculation />} />
        <Route path="new-calculation/:calculationId" element={<NewCalculation />} />
      </Route>
    </Routes>
  );
};

export default App;