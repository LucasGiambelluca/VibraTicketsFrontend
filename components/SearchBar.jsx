import React, { useState, useCallback } from "react";
import { Input, Select, Button, DatePicker, Row, Col, AutoComplete, Spin } from "antd";
import { SearchOutlined, EnvironmentOutlined, DollarOutlined, CalendarOutlined } from "@ant-design/icons";
import { eventsApi } from "../src/services/apiService";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";

const { Option } = Select;

export default function SearchBar() {
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Búsqueda con debounce
  const debouncedSearch = useCallback(
    debounce(async (value) => {
      if (value && value.length >= 2) {
        try {
          setLoading(true);
          const response = await eventsApi.searchEvents(value, 5);
          if (response.data && response.data.events) {
            const options = response.data.events.map(event => ({
              value: event.name,
              label: event.name,
              id: event.id
            }));
            setSearchOptions(options);
          }
        } catch (error) {
          console.error('Error searching events:', error);
          setSearchOptions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchOptions([]);
      }
    }, 300),
    []
  );

  const handleSearch = (value) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleSelect = (value, option) => {
    if (option && option.id) {
      navigate(`/events/${option.id}`);
    }
  };

  const handleSearchSubmit = () => {
    if (searchValue) {
      // Redirigir a página de resultados de búsqueda
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };
  return (
    <div
      style={{
        position: "relative",
        top: "-30px",
        zIndex: 2,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        padding: "20px 24px",
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <Row gutter={[8, 8]} justify="center" align="middle">
        {/* Buscar */}
        <Col xs={24} md={6}>
          <AutoComplete
            value={searchValue}
            options={searchOptions}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder="Buscar eventos..."
            allowClear
            style={{ width: '100%' }}
          >
            <Input
              prefix={<SearchOutlined />}
              suffix={loading ? <Spin size="small" /> : null}
            />
          </AutoComplete>
        </Col>

        {/* Ubicación */}
        <Col xs={12} md={4}>
          <Select
            placeholder="Ubicación"
            style={{ width: "100%" }}
            suffixIcon={<EnvironmentOutlined />}
          >
            <Option value="bsas">Buenos Aires</Option>
            <Option value="cordoba">Córdoba</Option>
            <Option value="rosario">Rosario</Option>
          </Select>
        </Col>

        {/* Precio */}
        <Col xs={12} md={4}>
          <Select
            placeholder="Precio"
            style={{ width: "100%" }}
            suffixIcon={<DollarOutlined />}
          >
            <Option value="0-5000">0 - 5.000</Option>
            <Option value="5000-20000">5.000 - 20.000</Option>
            <Option value="20000+">20.000+</Option>
          </Select>
        </Col>

        {/* Fecha */}
        <Col xs={12} md={4}>
          <DatePicker
            placeholder="Fecha"
            style={{ width: "100%" }}
            suffixIcon={<CalendarOutlined />}
          />
        </Col>

        {/* Botón */}
        <Col xs={12} md={4}>
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            block
            size="large"
            onClick={handleSearchSubmit}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              height: 48,
              fontSize: 16
            }}
          >
            Buscar
          </Button>
        </Col>
      </Row>
    </div>
  );
}
