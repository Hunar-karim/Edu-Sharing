/*
 * edu-sharing Repository REST API
 * The public restful API of the edu-sharing repository.
 *
 * OpenAPI spec version: 1.1
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


package io.swagger.client.model;

import java.util.Objects;
import java.util.Arrays;
import com.google.gson.TypeAdapter;
import com.google.gson.annotations.JsonAdapter;
import com.google.gson.annotations.SerializedName;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.client.model.Location;
import java.io.IOException;

/**
 * Provider
 */
@javax.annotation.Generated(value = "io.swagger.codegen.languages.JavaClientCodegen", date = "2021-06-09T17:32:21.273+02:00")
public class Provider {
  @SerializedName("legalName")
  private String legalName = null;

  @SerializedName("url")
  private String url = null;

  @SerializedName("email")
  private String email = null;

  /**
   * Gets or Sets areaServed
   */
  @JsonAdapter(AreaServedEnum.Adapter.class)
  public enum AreaServedEnum {
    ORGANIZATION("Organization"),
    
    CITY("City"),
    
    STATE("State"),
    
    COUNTRY("Country"),
    
    CONTINENT("Continent"),
    
    WORLD("World");

    private String value;

    AreaServedEnum(String value) {
      this.value = value;
    }

    public String getValue() {
      return value;
    }

    @Override
    public String toString() {
      return String.valueOf(value);
    }

    public static AreaServedEnum fromValue(String text) {
      for (AreaServedEnum b : AreaServedEnum.values()) {
        if (String.valueOf(b.value).equals(text)) {
          return b;
        }
      }
      return null;
    }

    public static class Adapter extends TypeAdapter<AreaServedEnum> {
      @Override
      public void write(final JsonWriter jsonWriter, final AreaServedEnum enumeration) throws IOException {
        jsonWriter.value(enumeration.getValue());
      }

      @Override
      public AreaServedEnum read(final JsonReader jsonReader) throws IOException {
        String value = jsonReader.nextString();
        return AreaServedEnum.fromValue(String.valueOf(value));
      }
    }
  }

  @SerializedName("areaServed")
  private AreaServedEnum areaServed = null;

  @SerializedName("location")
  private Location location = null;

  public Provider legalName(String legalName) {
    this.legalName = legalName;
    return this;
  }

   /**
   * Get legalName
   * @return legalName
  **/
  @ApiModelProperty(value = "")
  public String getLegalName() {
    return legalName;
  }

  public void setLegalName(String legalName) {
    this.legalName = legalName;
  }

  public Provider url(String url) {
    this.url = url;
    return this;
  }

   /**
   * Get url
   * @return url
  **/
  @ApiModelProperty(value = "")
  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public Provider email(String email) {
    this.email = email;
    return this;
  }

   /**
   * Get email
   * @return email
  **/
  @ApiModelProperty(value = "")
  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public Provider areaServed(AreaServedEnum areaServed) {
    this.areaServed = areaServed;
    return this;
  }

   /**
   * Get areaServed
   * @return areaServed
  **/
  @ApiModelProperty(value = "")
  public AreaServedEnum getAreaServed() {
    return areaServed;
  }

  public void setAreaServed(AreaServedEnum areaServed) {
    this.areaServed = areaServed;
  }

  public Provider location(Location location) {
    this.location = location;
    return this;
  }

   /**
   * Get location
   * @return location
  **/
  @ApiModelProperty(value = "")
  public Location getLocation() {
    return location;
  }

  public void setLocation(Location location) {
    this.location = location;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    Provider provider = (Provider) o;
    return Objects.equals(this.legalName, provider.legalName) &&
        Objects.equals(this.url, provider.url) &&
        Objects.equals(this.email, provider.email) &&
        Objects.equals(this.areaServed, provider.areaServed) &&
        Objects.equals(this.location, provider.location);
  }

  @Override
  public int hashCode() {
    return Objects.hash(legalName, url, email, areaServed, location);
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Provider {\n");
    
    sb.append("    legalName: ").append(toIndentedString(legalName)).append("\n");
    sb.append("    url: ").append(toIndentedString(url)).append("\n");
    sb.append("    email: ").append(toIndentedString(email)).append("\n");
    sb.append("    areaServed: ").append(toIndentedString(areaServed)).append("\n");
    sb.append("    location: ").append(toIndentedString(location)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }

}
